---
id: anti-pattern.process-stream-deadlock
category: performance
severity: high
applies_to: ProcessBuilder / external process invocation
---

# Draining a child process's stdout/stderr sequentially

## Why it matters

Pipes between a parent and child process have a bounded OS buffer (commonly 64KB). If a child
process writes enough to stderr while the parent is fully occupied reading stdout to EOF, the
child blocks trying to write to a full stderr pipe — and the parent never reaches the code that
would read stderr, because it's still waiting for stdout to close. Both sides wait on each other
forever. This class of bug is intermittent: it only appears once real output exceeds the pipe
buffer, so it can pass every manual test and then hang in production on a larger input.

## Real instance in this codebase

`chat-service/src/main/java/com/takypok/chatservice/service/IngestionService.java`
(`ingestViaPython`) reads the child's entire stdout before touching stderr:

```java
Process process = pb.start();
String stdout = new String(process.getInputStream().readAllBytes());
String stderr = new String(process.getErrorStream().readAllBytes());
int exitCode = process.waitFor();
```

For small, well-behaved documents this works today. It becomes a real hang the moment the Python
ingest script (`scripts/ingest.py`) logs enough to stderr — e.g. a verbose library warning per
chunk on a large `.pptx`/`.xlsx` — while `readAllBytes()` on stdout is still blocked waiting for
more stdout or EOF.

## Good example

Either merge the streams so there's only one to drain:

```java
ProcessBuilder pb = new ProcessBuilder(pythonBin, pythonScript, file.getAbsolutePath());
pb.redirectErrorStream(true); // stderr folded into stdout
Process process = pb.start();
String output = new String(process.getInputStream().readAllBytes());
int exitCode = process.waitFor();
```

...or drain both concurrently if they must stay separate:

```java
Process process = pb.start();
var stdoutFuture = CompletableFuture.supplyAsync(() -> readAll(process.getInputStream()));
var stderrFuture = CompletableFuture.supplyAsync(() -> readAll(process.getErrorStream()));
int exitCode = process.waitFor();
String stdout = stdoutFuture.join();
String stderr = stderrFuture.join();
```

## Detection heuristic

- `ProcessBuilder`/`Runtime.exec` followed by reading `getInputStream()` and `getErrorStream()`
  sequentially (one fully drained before the other starts).
- No `redirectErrorStream(true)` and no separate thread/future per stream.
- `waitFor()` called before either stream has been fully drained (the mirror-image bug: the
  process never receives its stdout consumer and blocks writing).
