import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Tag } from "antd";
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import { useReviewDiff } from "../hooks/useChat";

interface Preset {
  label: string;
  diff: string;
}

const PRESETS: Preset[] = [
  {
    label: "Blocking call",
    diff: `diff --git a/chat-service/src/main/java/com/takypok/chatservice/service/ReportService.java b/chat-service/src/main/java/com/takypok/chatservice/service/ReportService.java
index 1111111..2222222 100644
--- a/chat-service/src/main/java/com/takypok/chatservice/service/ReportService.java
+++ b/chat-service/src/main/java/com/takypok/chatservice/service/ReportService.java
@@ -10,7 +10,9 @@ public class ReportService {
   private final ExternalReportClient externalReportClient;

   public Mono<ReportSummary> summarize(UUID reportId) {
-    return externalReportClient.fetchSummary(reportId);
+    ReportSummary summary = externalReportClient.fetchSummary(reportId).block();
+    return Mono.just(summary);
   }
 }
`,
  },
  {
    label: "God class",
    diff: `diff --git a/chat-service/src/main/java/com/takypok/chatservice/service/IngestionService.java b/chat-service/src/main/java/com/takypok/chatservice/service/IngestionService.java
index 1111111..2222222 100644
--- a/chat-service/src/main/java/com/takypok/chatservice/service/IngestionService.java
+++ b/chat-service/src/main/java/com/takypok/chatservice/service/IngestionService.java
@@ -40,4 +40,17 @@ public class IngestionService {
   public void ingestAll() { /* directory walking + parsing + vector-store mutation */ }
+
+  // New: this service now also renders PDF thumbnails and sends Slack alerts on ingest failure
+  public byte[] renderThumbnail(File pdf) { /* PDF rasterization */ return null; }
+
+  public void notifySlackOnFailure(String channel, Exception e) {
+    slackClient.postMessage(channel, "Ingestion failed: " + e.getMessage());
+  }
 }
`,
  },
  {
    label: "Optional misuse",
    diff: `diff --git a/chat-service/src/main/java/com/takypok/chatservice/service/ConversationService.java b/chat-service/src/main/java/com/takypok/chatservice/service/ConversationService.java
index 1111111..2222222 100644
--- a/chat-service/src/main/java/com/takypok/chatservice/service/ConversationService.java
+++ b/chat-service/src/main/java/com/takypok/chatservice/service/ConversationService.java
@@ -20,6 +20,10 @@ public class ConversationService {
   public Conversation getConversation(UUID id) {
-    return conversationRepository.findById(id).orElseThrow();
+    Optional<Conversation> found = conversationRepository.findById(id);
+    return found.get();
   }
+
+  public class ConversationRequest {
+    private Optional<String> title;
+  }
 }
`,
  },
  {
    label: "Double subscription",
    diff: `diff --git a/chat-service/src/main/java/com/takypok/chatservice/service/MessageService.java b/chat-service/src/main/java/com/takypok/chatservice/service/MessageService.java
index 1111111..2222222 100644
--- a/chat-service/src/main/java/com/takypok/chatservice/service/MessageService.java
+++ b/chat-service/src/main/java/com/takypok/chatservice/service/MessageService.java
@@ -30,7 +30,13 @@ public class MessageService {
   public Mono<MessageResponse> sendAndNotify(SendMessageRequest request, EmployeeDirectory sender) {
-    return messageRepository.save(toEntity(request, sender)).map(this::toResponse);
+    Mono<Message> saved = messageRepository.save(toEntity(request, sender));
+
+    if (request.isUrgent()) {
+      saved.flatMap(this::pushUrgentNotification).subscribe();
+    }
+    return saved.map(this::toResponse);
   }
 }
`,
  },
  {
    label: "Expensive re-allocation",
    diff: `diff --git a/core-v1/src/main/java/com/takypok/core/util/AuthenticationUtil.java b/core-v1/src/main/java/com/takypok/core/util/AuthenticationUtil.java
index 1111111..2222222 100644
--- a/core-v1/src/main/java/com/takypok/core/util/AuthenticationUtil.java
+++ b/core-v1/src/main/java/com/takypok/core/util/AuthenticationUtil.java
@@ -15,6 +15,7 @@ public class AuthenticationUtil {
   private static Mono<Void> setUnauthorized(ServerHttpResponse response) {
     response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
     response.setStatusCode(HttpStatus.FORBIDDEN);
+    ObjectMapper objectMapper = new ObjectMapper();
     ...
   }
 }
`,
  },
  {
    label: "Swallowed exception",
    diff: `diff --git a/core-v1/src/main/java/com/takypok/core/util/AuthenticationUtil.java b/core-v1/src/main/java/com/takypok/core/util/AuthenticationUtil.java
index 1111111..2222222 100644
--- a/core-v1/src/main/java/com/takypok/core/util/AuthenticationUtil.java
+++ b/core-v1/src/main/java/com/takypok/core/util/AuthenticationUtil.java
@@ -22,6 +22,10 @@ public class AuthenticationUtil {
     try {
       return response.writeWith(Mono.just(responseBuffer));
+    } catch (Exception ignored) {
+      return Mono.empty();
     }
   }
 }
`,
  },
  {
    label: "3rd-party call in @Transactional",
    diff: `diff --git a/auth-service/src/main/java/com/takypok/authservice/service/impl/UserServiceImpl.java b/auth-service/src/main/java/com/takypok/authservice/service/impl/UserServiceImpl.java
index 1111111..2222222 100644
--- a/auth-service/src/main/java/com/takypok/authservice/service/impl/UserServiceImpl.java
+++ b/auth-service/src/main/java/com/takypok/authservice/service/impl/UserServiceImpl.java
@@ -18,6 +18,8 @@ public class UserServiceImpl {
   @Transactional
   public void create(CreateUserRequest request) {
     userDetailsManager.createUser(user);
     userinfoRepository.save(userinfo);
+
+    publishAccountEvent(userinfo); // Kafka publish
   }
 }
`,
  },
  {
    label: "Unsynchronized shared state",
    diff: `diff --git a/chat-service/src/main/java/com/takypok/chatservice/service/PresenceService.java b/chat-service/src/main/java/com/takypok/chatservice/service/PresenceService.java
index 1111111..2222222 100644
--- a/chat-service/src/main/java/com/takypok/chatservice/service/PresenceService.java
+++ b/chat-service/src/main/java/com/takypok/chatservice/service/PresenceService.java
@@ -8,6 +8,7 @@ import java.util.Map;
 @Component
 public class PresenceService {
+  private final Map<String, Long> lastSeenBySub = new HashMap<>();

   public void touch(String sub) {
-    // no-op
+    lastSeenBySub.put(sub, System.currentTimeMillis());
   }
 }
`,
  },
  {
    label: "Clean diff (control)",
    diff: `diff --git a/chat-service/src/main/java/com/takypok/chatservice/service/ReportService.java b/chat-service/src/main/java/com/takypok/chatservice/service/ReportService.java
index 1111111..2222222 100644
--- a/chat-service/src/main/java/com/takypok/chatservice/service/ReportService.java
+++ b/chat-service/src/main/java/com/takypok/chatservice/service/ReportService.java
@@ -10,7 +10,7 @@ public class ReportService {
   private final ExternalReportClient externalReportClient;

   public Mono<ReportSummary> summarize(UUID reportId) {
-    return externalReportClient.fetchSummary(reportId);
+    return externalReportClient.fetchSummary(reportId)
+        .doOnNext(summary -> log.debug("Fetched report summary for {}", reportId));
   }
 }
`,
  },
];

export default function CodeReviewPage() {
  const [diff, setDiff] = useState("");
  const { mutate: review, data, isPending, isError, reset } = useReviewDiff();

  function submit() {
    if (isPending) return;
    review(diff);
  }

  function loadPreset(preset: Preset) {
    reset();
    setDiff(preset.diff);
  }

  return (
    <div className="h-full flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <Link
          to="/assistant"
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-faint)] hover:text-[var(--accent)]"
        >
          <ArrowLeftOutlined /> Back to chat
        </Link>
        <span className="text-[14px] font-bold text-[var(--text)] ml-2">Code Review (RAG)</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <Button key={p.label} size="small" onClick={() => loadPreset(p)}>
            {p.label}
          </Button>
        ))}
        <Button
          size="small"
          danger
          onClick={() => {
            reset();
            setDiff("");
          }}
        >
          Blank diff
        </Button>
      </div>

      <div className="flex-1 min-h-0 flex gap-3.5">
        <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] text-xs font-semibold text-[var(--text)]">
            Diff under review
          </div>
          <Input.TextArea
            value={diff}
            onChange={(e) => setDiff(e.target.value)}
            placeholder="Paste a git diff, or pick a preset above..."
            className="!flex-1 !h-full !text-[12px] !font-mono !resize-none !border-none !rounded-none"
          />
          <div className="px-4 py-3 border-t border-[var(--border)] flex justify-end">
            <Button type="primary" icon={<SendOutlined />} onClick={submit} loading={isPending}>
              Review
            </Button>
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] text-xs font-semibold text-[var(--text)]">
            Result
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {isError && (
              <div className="text-[13px] text-red-500">Error: could not reach the AI service.</div>
            )}
            {isPending && (
              <div className="text-[13px] text-[var(--text-faint)]">Reviewing…</div>
            )}
            {data && (
              <>
                <div className="text-[13px] leading-[1.6] whitespace-pre-wrap break-words text-[var(--text)]">
                  {data.review}
                </div>
                {data.rulesConsidered.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap gap-1.5">
                    {data.rulesConsidered.map((r) => (
                      <Tag key={r}>{r}</Tag>
                    ))}
                  </div>
                )}
              </>
            )}
            {!data && !isPending && !isError && (
              <div className="text-[13px] text-[var(--text-faint)]">
                Pick a preset or paste a diff, then click Review.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
