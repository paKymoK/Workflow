## Chat Service — Usage Guide

## Overview

The Chat Service is a Spring Boot 3.5.7 RAG (Retrieval-Augmented Generation) microservice that answers questions about the CRM system in Vietnamese. It ingests documents from a local folder into a Qdrant vector store, then uses Ollama to generate answers grounded in those documents.

## Prerequisites

- **Java 17** (JDK 17)
- **Gradle** (wrapper included — no install needed)
- **Ollama** — local LLM runtime: https://ollama.com/download
- **Qdrant** — vector store: https://qdrant.tech/documentation/quick-start/
- **Python 3** with `python-docx`, `openpyxl`, `python-pptx`, `qdrant-client`, `ollama` packages (required only for `.docx`, `.xlsx`, `.pptx` ingestion)

### Pull required models before running

```bash
ollama pull qwen3:14b-q4_K_M
ollama pull bge-m3
```

## Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `server.port` | int | `8083` | HTTP port the service listens on |
| `spring.ai.ollama.base-url` | string | `http://localhost:11434` | Ollama server URL |
| `spring.ai.ollama.chat.model` | string | `qwen3:14b-q4_K_M` | Chat/LLM model name |
| `spring.ai.ollama.chat.options.temperature` | float | `0.1` | Model temperature — keep low for factual Q&A |
| `spring.ai.ollama.chat.options.num-ctx` | int | `8192` | Context window size in tokens |
| `spring.ai.ollama.embedding.model` | string | `bge-m3` | Embedding model — do NOT change |
| `spring.ai.vectorstore.qdrant.host` | string | `localhost` | Qdrant host |
| `spring.ai.vectorstore.qdrant.port` | int | `6334` | Qdrant gRPC port |
| `spring.ai.vectorstore.qdrant.collection-name` | string | `crm_vi` | Qdrant collection — do NOT change without re-ingesting |
| `spring.ai.vectorstore.qdrant.initialize-schema` | bool | `true` | Auto-creates the collection on first run |
| `eureka.client.service-url.defaultZone` | string | `http://127.0.0.1:8761/eureka` | Eureka discovery URL (`EUREKA_URI` env var) |
| `ingest.python.bin` | string | `python3` | Python binary used to ingest Office files |
| `ingest.python.script` | string | `scripts/ingest.py` | Path to the Python ingestion script |

## How to Run

```bash
# 1. Start Qdrant (Docker)
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# 2. Start Ollama
ollama serve

# 3. Pull models (only needed once)
ollama pull qwen3:14b-q4_K_M
ollama pull bge-m3

# 4. Start Eureka discovery service (from repo root)
./gradlew :discovery-service:bootRun

# 5. Build and run the chat service (from repo root)
./gradlew :chat-service:bootRun
```

The service starts on `http://localhost:8083`.

## How to Ingest Documents

### Where to place files

Drop files into:

```
chat-service/src/main/resources/documents/
```

### Supported file types

| Extension | Handler |
|-----------|---------|
| `.pdf` | Java (Spring AI PDF reader) |
| `.txt` | Java (plain text reader) |
| `.md` | Java (plain text reader) |
| `.docx` | Python (`scripts/ingest.py`) |
| `.xlsx` | Python (`scripts/ingest.py`) |
| `.pptx` | Python (`scripts/ingest.py`) |

### Trigger ingestion

```bash
curl -X POST http://localhost:8083/assist/ingest
```

### What happens on ingest

1. All existing vectors in the `crm_vi` collection are deleted (`nukeCollection`).
2. Every file in `documents/` is processed — `.docx`/`.xlsx`/`.pptx` via the Python script; `.pdf`/`.txt`/`.md` via Java.
3. Documents are split into 400-token chunks with 60-token overlap.
4. Chunks are embedded with `bge-m3` and stored in Qdrant.
5. The response lists ingested, skipped (duplicate filename), and failed files.

Re-running ingestion always clears all previous vectors first — there are no incremental updates.

## How to Use the Chat

### Ask a question

```bash
curl -X POST http://localhost:8083/assist/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Hướng dẫn tạo ticket mới trong hệ thống CRM?"}'
```

### Response format

```json
{
  "answer": "Để tạo ticket mới, bạn vào menu Ticket → Tạo mới...",
  "sources": ["huong-dan-su-dung.pdf", "quy-trinh-crm.docx"]
}
```

### Health check

```bash
curl http://localhost:8083/assist/health
```

Returns `200 OK` with body `OK` when the service is up.

## Common Errors & Fixes

### `Connection refused` to Qdrant on port 6334

Qdrant is not running. Start it:

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

### `Connection refused` to Ollama on port 11434

Ollama server is not running. Start it:

```bash
ollama serve
```

### Model not found: `qwen3:14b-q4_K_M` or `bge-m3`

The model has not been pulled. Run:

```bash
ollama pull qwen3:14b-q4_K_M
ollama pull bge-m3
```

### Python ingest fails: `No module named 'docx'` (or similar)

Install the required Python packages:

```bash
pip install python-docx openpyxl python-pptx qdrant-client ollama
```

### Ingestion returns empty `ingested` list

The `documents/` folder is empty or files have unsupported extensions. Place supported files in `chat-service/src/main/resources/documents/` before calling `/ingest`.

### Answers contain `<think>...</think>` blocks

This is Qwen3's thinking mode leaking into output. It should be suppressed by `/no_think` in the system prompt and stripped by `AssistantService.stripThinkingTokens`. If you see it, verify both mitigations are in place and rebuild.

### Service not registered in Eureka

The `discovery-service` must be running before starting `chat-service`. Start it first with `./gradlew :discovery-service:bootRun`.
