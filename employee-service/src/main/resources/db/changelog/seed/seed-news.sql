-- ============================================================
-- Seed: test/dev-only News & Events posts, ported from the mobile app's old
-- local mock (frontend/mobile-front-end/src/data/news.ts) so the feed has
-- real content, attributed to real seeded employees
-- (seed/seed-fake-employees.sql). Two posts are marked anonymous so that
-- rendering path has real test data too. Raw SQL is fine here — unlike
-- employee data, nothing downstream consumes news via Kafka.
-- ============================================================

-- created_at is set explicitly (staggered, oldest to newest) rather than left to
-- @CreatedDate auditing — raw SQL inserts bypass R2DBC's auditing framework entirely
-- (the same gap already documented for employee_mirror/employee_directory elsewhere
-- in this project), so a null created_at would otherwise break both feed sort order
-- and the mobile app's relative-time display.
INSERT INTO news_post (author_sub, is_anonymous, type, pinned, title, body, image_url, created_at) VALUES
  ('ndtu24', false, 'RECOGNITION', true, 'CEO Message: Mid-Year Review 2025',
   E'Dear CMC Global family,\n\nI am proud to share that we achieved 97% of our H1 production targets. Your dedication and hard work have made this possible.\n\nAs we move into H2, let us continue striving for excellence together. New initiatives around quality control and line efficiency will roll out in August — more details to follow from department heads.\n\nThank you for everything you do every day.\n\n— Mr. Tran Quoc Hung, CEO',
   'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=280&fit=crop&auto=format', now() - interval '5 days'),

  ('nmngoc5', false, 'RECOGNITION', false, '🏆 Employee of the Month — July 2025',
   E'Congratulations to Tran Van Duc (Line A Supervisor) for outstanding leadership and quality control excellence this month!\n\nHis team achieved 0% defect rate for 3 consecutive weeks — an exceptional result that sets a new benchmark for Line A. Tran Van Duc consistently goes above and beyond, mentoring junior operators and driving process improvements on the floor.\n\nPlease join us in congratulating him at the brief ceremony on Friday, July 11 at 2:00 PM in the main cafeteria.',
   'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=280&fit=crop&auto=format', now() - interval '2 hours'),

  ('natuan25', true, 'NEWS', false, 'New Safety Equipment Distribution',
   E'FR (flame-resistant) work uniforms and safety gloves will be distributed to all Line A, B, and C workers starting Monday, July 14.\n\nPlease collect your equipment from your line supervisor between 6:00–7:00 AM before your shift starts. Sizes were confirmed from the earlier survey — if your size is incorrect, contact HR ext. 201 within 3 days of receiving.\n\nReminder: wearing approved PPE at all times on the production floor is mandatory per company safety policy.',
   NULL, now() - interval '1 day'),

  ('btngoc2', false, 'EVENTS', false, 'Company Family Picnic — August 16, 2025',
   E'We are excited to announce our Annual Family Picnic at Suoi Tien Theme Park on Saturday, August 16, 2025!\n\nFamily members are warmly welcome. CMC Global will provide:\n• Free bus transport from the factory (departs 7:30 AM)\n• Admission tickets for employees and up to 3 family members\n• Lunch and refreshments included\n• Prizes and games for children\n\nRegistration closes July 20. Sign up via the Survey tab or contact HR ext. 201. Don''t miss out!',
   'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&h=280&fit=crop&auto=format', now() - interval '3 days'),

  ('nvtu3', true, 'UNION', false, 'Q3 Benefits Review Meeting — July 18',
   E'📅 Date: Friday, July 18, 2025\n🕓 Time: 4:00 PM – 5:30 PM\n📍 Venue: Main Cafeteria, Building A\n\nAgenda:\n1. Meal allowance increase proposal (from ₫25,000 to ₫35,000/day)\n2. Shift rotation policy update — new 2-week rotation schedule\n3. Annual leave carry-forward policy clarification\n4. Q&A and open floor\n\nAttendance is strongly encouraged. All issues raised will be minuted and escalated to HR management.',
   NULL, now() - interval '4 days');

-- created_at is offset a few minutes after each parent post's created_at, same reasoning
-- as above (raw SQL bypasses auditing, and the mobile UI's relative-time display needs a
-- real timestamp, not null).
INSERT INTO news_comment (post_id, commenter_sub, content, created_at) VALUES
  ((SELECT id FROM news_post WHERE title = 'CEO Message: Mid-Year Review 2025'), 'dvtuan4',
   'Thank you for the inspiring message! Proud to be part of CMC Global.',
   (SELECT created_at FROM news_post WHERE title = 'CEO Message: Mid-Year Review 2025') + interval '20 minutes'),
  ((SELECT id FROM news_post WHERE title = 'CEO Message: Mid-Year Review 2025'), 'ldduc',
   '97% in H1 — incredible achievement. The whole team worked so hard!',
   (SELECT created_at FROM news_post WHERE title = 'CEO Message: Mid-Year Review 2025') + interval '35 minutes'),
  ((SELECT id FROM news_post WHERE title = 'CEO Message: Mid-Year Review 2025'), 'ndtoi',
   'Looking forward to the new initiatives in August. H2 will be even better!',
   (SELECT created_at FROM news_post WHERE title = 'CEO Message: Mid-Year Review 2025') + interval '50 minutes'),

  ((SELECT id FROM news_post WHERE title = '🏆 Employee of the Month — July 2025'), 'nmhoang6',
   'Congratulations Duc!! So well deserved.',
   (SELECT created_at FROM news_post WHERE title = '🏆 Employee of the Month — July 2025') + interval '10 minutes'),
  ((SELECT id FROM news_post WHERE title = '🏆 Employee of the Month — July 2025'), 'ntnghia4',
   '0% defect rate for 3 weeks — that is incredible. An inspiration to us all!',
   (SELECT created_at FROM news_post WHERE title = '🏆 Employee of the Month — July 2025') + interval '25 minutes'),
  ((SELECT id FROM news_post WHERE title = '🏆 Employee of the Month — July 2025'), 'nvtuan16',
   'Very proud of you, Duc. Keep leading by example!',
   (SELECT created_at FROM news_post WHERE title = '🏆 Employee of the Month — July 2025') + interval '40 minutes'),

  ((SELECT id FROM news_post WHERE title = 'New Safety Equipment Distribution'), 'nxmanh1',
   'When will Line C get theirs? Our supervisor hasn''t been notified yet.',
   (SELECT created_at FROM news_post WHERE title = 'New Safety Equipment Distribution') + interval '2 hours'),
  ((SELECT id FROM news_post WHERE title = 'New Safety Equipment Distribution'), 'phanh5',
   'Confirmed — Line B supervisors have all been briefed. Collection starts Monday 6 AM.',
   (SELECT created_at FROM news_post WHERE title = 'New Safety Equipment Distribution') + interval '3 hours'),

  ((SELECT id FROM news_post WHERE title = 'Company Family Picnic — August 16, 2025'), 'ptduong1',
   'Can''t wait! My kids are already so excited about Suoi Tien.',
   (SELECT created_at FROM news_post WHERE title = 'Company Family Picnic — August 16, 2025') + interval '1 hour'),
  ((SELECT id FROM news_post WHERE title = 'Company Family Picnic — August 16, 2025'), 'txdat2',
   'Is there a bus from Gate 2 or only Gate 1? Want to make sure my family knows where to meet.',
   (SELECT created_at FROM news_post WHERE title = 'Company Family Picnic — August 16, 2025') + interval '4 hours'),
  ((SELECT id FROM news_post WHERE title = 'Company Family Picnic — August 16, 2025'), 'btngoc2',
   'Hi Tran Van An — buses depart from Gate 1 only. Please arrive by 7:15 AM. See you there!',
   (SELECT created_at FROM news_post WHERE title = 'Company Family Picnic — August 16, 2025') + interval '5 hours'),

  ((SELECT id FROM news_post WHERE title = 'Q3 Benefits Review Meeting — July 18'), 'admin',
   'Will the meal allowance increase be backdated to Q2 or only effective Q3?',
   (SELECT created_at FROM news_post WHERE title = 'Q3 Benefits Review Meeting — July 18') + interval '1 hour'),
  ((SELECT id FROM news_post WHERE title = 'Q3 Benefits Review Meeting — July 18'), 'tqthai',
   'Important meeting everyone. All union members should attend — let''s make our voices heard.',
   (SELECT created_at FROM news_post WHERE title = 'Q3 Benefits Review Meeting — July 18') + interval '2 hours');

INSERT INTO news_reaction (post_id, participant_sub, emoji) VALUES
  ((SELECT id FROM news_post WHERE title = 'CEO Message: Mid-Year Review 2025'), 'dvtuan4', 'celebrate'),
  ((SELECT id FROM news_post WHERE title = 'CEO Message: Mid-Year Review 2025'), 'ldduc', 'like'),
  ((SELECT id FROM news_post WHERE title = 'CEO Message: Mid-Year Review 2025'), 'ndtoi', 'insightful'),
  ((SELECT id FROM news_post WHERE title = 'CEO Message: Mid-Year Review 2025'), 'tqthai', 'like'),

  ((SELECT id FROM news_post WHERE title = '🏆 Employee of the Month — July 2025'), 'nmhoang6', 'celebrate'),
  ((SELECT id FROM news_post WHERE title = '🏆 Employee of the Month — July 2025'), 'ntnghia4', 'love'),
  ((SELECT id FROM news_post WHERE title = '🏆 Employee of the Month — July 2025'), 'nvtuan16', 'celebrate'),

  ((SELECT id FROM news_post WHERE title = 'New Safety Equipment Distribution'), 'nxmanh1', 'insightful'),
  ((SELECT id FROM news_post WHERE title = 'New Safety Equipment Distribution'), 'phanh5', 'like'),

  ((SELECT id FROM news_post WHERE title = 'Company Family Picnic — August 16, 2025'), 'ptduong1', 'love'),
  ((SELECT id FROM news_post WHERE title = 'Company Family Picnic — August 16, 2025'), 'txdat2', 'celebrate'),
  ((SELECT id FROM news_post WHERE title = 'Company Family Picnic — August 16, 2025'), 'btngoc2', 'love'),
  ((SELECT id FROM news_post WHERE title = 'Company Family Picnic — August 16, 2025'), 'admin', 'like'),

  ((SELECT id FROM news_post WHERE title = 'Q3 Benefits Review Meeting — July 18'), 'admin', 'insightful'),
  ((SELECT id FROM news_post WHERE title = 'Q3 Benefits Review Meeting — July 18'), 'tqthai', 'like');

INSERT INTO news_comment_like (comment_id, participant_sub) VALUES
  ((SELECT id FROM news_comment WHERE content = '97% in H1 — incredible achievement. The whole team worked so hard!'), 'ndtu24'),
  ((SELECT id FROM news_comment WHERE content = '97% in H1 — incredible achievement. The whole team worked so hard!'), 'ndtoi'),
  ((SELECT id FROM news_comment WHERE content = 'Congratulations Duc!! So well deserved.'), 'nmngoc5'),
  ((SELECT id FROM news_comment WHERE content = 'Congratulations Duc!! So well deserved.'), 'ntnghia4'),
  ((SELECT id FROM news_comment WHERE content = 'Congratulations Duc!! So well deserved.'), 'nvtuan16'),
  ((SELECT id FROM news_comment WHERE content = 'Can''t wait! My kids are already so excited about Suoi Tien.'), 'btngoc2'),
  ((SELECT id FROM news_comment WHERE content = 'Can''t wait! My kids are already so excited about Suoi Tien.'), 'txdat2');
