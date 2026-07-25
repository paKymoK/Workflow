// chat-conversations-stress-test.js
//
// Stress test for chat-service's conversation/message REST API (create conversation,
// send/list/search messages, reactions, read receipts, typing indicators).
//
// Run with k6 (https://k6.io/docs/get-started/installation/):
//
//   k6 run chat-service/scripts/loadtest/chat-conversations-stress-test.js
//
// Useful overrides (env vars, all optional):
//   CHAT_URL          base URL for chat-service. Defaults to going through the gateway
//                      (http://localhost:8080/chat-service) — the real traffic path.
//                      Point it at http://localhost:8083 to hit chat-service directly
//                      and isolate it from gateway overhead.
//   AUTH_URL           auth-service base URL, default http://localhost:9000
//   PEAK_VUS            peak concurrent virtual users, default 30
//   CHAT_USERS          how many distinct chat accounts to provision, default = PEAK_VUS
//   RAMP_UP / STEADY / RAMP_DOWN   stage durations, defaults "30s" / "2m" / "30s"
//
// Prerequisites: the full local stack must be up (docker-compose up, or at least
// discovery-service + auth-service + chat-service + gateway-service + postgres + redis + kafka),
// since this script provisions real accounts and drives a real OAuth2 login for each one.
// See auth.js for how tokens are obtained — access tokens are short-lived (15 min), so keep
// STEADY well under that or accept that later requests may start failing on 401 as they expire.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { provisionAndLogin } from './auth.js';

const CHAT_URL = (__ENV.CHAT_URL || 'http://localhost:8080/chat-service').replace(/\/$/, '');
const PEAK_VUS = Number(__ENV.PEAK_VUS || 30);
const USER_COUNT = Number(__ENV.CHAT_USERS || PEAK_VUS);

export const options = {
  stages: [
    { duration: __ENV.RAMP_UP || '30s', target: PEAK_VUS },
    { duration: __ENV.STEADY || '2m', target: PEAK_VUS },
    { duration: __ENV.RAMP_DOWN || '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    'chat_action_duration{action:send_message}': ['p(95)<600'],
  },
  setupTimeout: '5m',
};

const chatActionDuration = new Trend('chat_action_duration', true);
const chatActionFailureRate = new Rate('chat_action_failure_rate');

const SAMPLE_SENTENCES = [
  'Can someone review the latest PR?',
  'Deploy went out fine, monitoring dashboards look green.',
  'Anyone free for a quick sync in 10?',
  'Pushed a fix for the null pointer in the reactive pipeline.',
  'Standup notes are in the doc, please add blockers.',
  'Load test running now, will share numbers shortly.',
  'Reminder: sprint review is tomorrow at 3pm.',
  'The staging env is flaky again, looking into it.',
  ':+1: sounds good to me',
  'Can you share the API docs link again?',
];

function randomMessage() {
  return SAMPLE_SENTENCES[Math.floor(Math.random() * SAMPLE_SENTENCES.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function timed(action, fn) {
  const start = Date.now();
  const res = fn();
  chatActionDuration.add(Date.now() - start, { action });
  chatActionFailureRate.add(res.status >= 400 || res.status === 0, { action });
  return res;
}

export function setup() {
  console.log(`Provisioning ${USER_COUNT} chat accounts against ${CHAT_URL} ...`);
  const users = [];
  for (let i = 0; i < USER_COUNT; i++) {
    users.push(provisionAndLogin(i));
  }

  // One shared GROUP conversation everyone posts into — the "busy channel" scenario.
  const creator = users[0];
  const groupRes = http.post(
    `${CHAT_URL}/chat/conversations`,
    JSON.stringify({
      type: 'GROUP',
      name: `k6-stress-${Date.now()}`,
      participantSubs: users.slice(1).map((u) => u.sub),
      privateChannel: true,
    }),
    { headers: authHeaders(creator.accessToken), tags: { name: 'setup_create_group' } },
  );
  if (!check(groupRes, { 'group conversation created': (r) => r.status === 200 })) {
    throw new Error(`setup: failed to create group conversation: ${groupRes.status} ${groupRes.body}`);
  }
  const groupConversationId = groupRes.json('id');

  // A DIRECT conversation per consecutive pair of users — the "1:1 DM" scenario.
  const directConversations = [];
  for (let i = 0; i + 1 < users.length; i += 2) {
    const res = http.post(
      `${CHAT_URL}/chat/conversations`,
      JSON.stringify({ type: 'DIRECT', participantSubs: [users[i + 1].sub] }),
      { headers: authHeaders(users[i].accessToken), tags: { name: 'setup_create_direct' } },
    );
    if (check(res, { 'direct conversation created': (r) => r.status === 200 })) {
      directConversations.push({ id: res.json('id'), members: [i, i + 1] });
    }
  }

  console.log(
    `Setup complete: ${users.length} users, 1 group conversation, ${directConversations.length} direct conversations.`,
  );
  return { users, groupConversationId, directConversations };
}

// Per-VU state (each VU runs its own JS isolate, so this is safe without locking).
let lastGroupMessageId = null;

function sendGroupMessage(data, headers) {
  const asReply = lastGroupMessageId !== null && Math.random() < 0.2;
  const res = timed('send_message', () =>
    http.post(
      `${CHAT_URL}/chat/conversations/${data.groupConversationId}/messages`,
      JSON.stringify({
        content: randomMessage(),
        messageType: 'TEXT',
        parentMessageId: asReply ? lastGroupMessageId : null,
      }),
      { headers, tags: { name: 'send_group_message' } },
    ),
  );
  if (check(res, { 'group message sent': (r) => r.status === 200 })) {
    lastGroupMessageId = res.json('id');
  }
}

function sendDirectMessage(data, userIdx, headers) {
  const dm = data.directConversations.find((d) => d.members.includes(userIdx));
  if (!dm) return; // odd user out when USER_COUNT is odd — just skip
  const res = timed('send_message', () =>
    http.post(
      `${CHAT_URL}/chat/conversations/${dm.id}/messages`,
      JSON.stringify({ content: randomMessage(), messageType: 'TEXT' }),
      { headers, tags: { name: 'send_direct_message' } },
    ),
  );
  check(res, { 'direct message sent': (r) => r.status === 200 });
}

function listGroupMessages(data, headers) {
  const res = timed('list_messages', () =>
    http.get(`${CHAT_URL}/chat/conversations/${data.groupConversationId}/messages?size=30`, {
      headers,
      tags: { name: 'list_messages' },
    }),
  );
  check(res, { 'messages listed': (r) => r.status === 200 });
}

function reactToLastMessage(data, headers) {
  if (lastGroupMessageId === null) return listGroupMessages(data, headers);
  const emoji = ['\u{1F44D}', '\u{1F525}', '❤️', '\u{1F602}'][Math.floor(Math.random() * 4)];
  const res = timed('toggle_reaction', () =>
    http.post(
      `${CHAT_URL}/chat/conversations/${data.groupConversationId}/messages/${lastGroupMessageId}/reactions`,
      JSON.stringify({ emoji }),
      { headers, tags: { name: 'toggle_reaction' } },
    ),
  );
  check(res, { 'reaction toggled': (r) => r.status === 200 });
}

function markGroupRead(data, headers) {
  const res = timed('mark_read', () =>
    http.post(`${CHAT_URL}/chat/conversations/${data.groupConversationId}/read`, null, {
      headers,
      tags: { name: 'mark_read' },
    }),
  );
  check(res, { 'marked read': (r) => r.status === 200 });
}

function typingIndicator(data, headers) {
  const res = timed('typing', () =>
    http.post(`${CHAT_URL}/chat/conversations/${data.groupConversationId}/typing`, null, {
      headers,
      tags: { name: 'typing' },
    }),
  );
  check(res, { 'typing notified': (r) => r.status === 200 });
}

function listConversations(headers) {
  const res = timed('list_conversations', () =>
    http.get(`${CHAT_URL}/chat/conversations?size=20`, { headers, tags: { name: 'list_conversations' } }),
  );
  check(res, { 'conversations listed': (r) => r.status === 200 });
}

export default function (data) {
  const userIdx = (__VU - 1) % data.users.length;
  const user = data.users[userIdx];
  const headers = authHeaders(user.accessToken);

  // Weighted action mix approximating a busy but realistic chat channel: mostly reads and
  // sends, occasional reactions/typing/read-receipts, rare 1:1 DMs.
  const roll = Math.random();
  if (roll < 0.45) {
    sendGroupMessage(data, headers);
  } else if (roll < 0.7) {
    listGroupMessages(data, headers);
  } else if (roll < 0.8) {
    reactToLastMessage(data, headers);
  } else if (roll < 0.88) {
    markGroupRead(data, headers);
  } else if (roll < 0.94) {
    typingIndicator(data, headers);
  } else if (roll < 0.98) {
    listConversations(headers);
  } else {
    sendDirectMessage(data, userIdx, headers);
  }

  sleep(randomBetween(0.5, 2));
}
