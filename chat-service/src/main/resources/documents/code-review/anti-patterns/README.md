# Anti-pattern rule docs

One topic per file, each self-contained with: why it matters, a bad example, a good example, and a
detection heuristic — the retrieval unit for the code-review RAG pipeline. Where a real instance
exists in this repo it's cited by file path instead of invented, so the retrieved example matches
the actual codebase's idioms (WebFlux/Reactor, Lombok, this repo's shared `core-v1` utilities).

| File | Category | Severity | Grounded in real code? |
|---|---|---|---|
| `blocking-call-in-reactive-pipeline.md` | performance | high | synthetic (flags real risk: repo mixes r2dbc + data-jdbc) |
| `process-stream-deadlock.md` | performance | high | real — `IngestionService.ingestViaPython` |
| `swallowed-exception.md` | convention | medium | real — `AuthenticationUtil` (bad) vs `ChatSessionRegistry` (good) |
| `repeated-expensive-object-allocation.md` | performance | low | real — `AuthenticationUtil.setUnauthorized` |
| `reactor-multiple-subscription-side-effects.md` | performance | high | synthetic |
| `unsynchronized-shared-mutable-state.md` | performance | high | real good example — `ChatSessionRegistry` |
| `optional-and-null-misuse.md` | convention | medium | synthetic |
| `god-class-mixed-responsibilities.md` | convention | medium | real discussion case — `IngestionService` |

Not covered yet (deliberately deferred): auth/authorization-specific rules and the broader
convention checklist (layering, naming) — those are separate rule categories to author next, not
anti-patterns in the sense of "generally known to be wrong Java."
