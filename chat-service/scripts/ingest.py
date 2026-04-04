# ingest.py
import os
import sys
from pathlib import Path

from langchain_community.document_loaders import (
    Docx2txtLoader,
    UnstructuredExcelLoader,
    UnstructuredPowerPointLoader,
)
from langchain.text_splitter import TokenTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

# ── Config (injected by Java — all values sourced from application.yaml) ──────
QDRANT_URL      = os.getenv("QDRANT_URL",      "http://localhost:6334")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION","crm_vi")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL",  "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL",  "bge-m3")

# ── Loaders ───────────────────────────────────────────────────────────────────
LOADERS = {
    ".docx": lambda f: Docx2txtLoader(f),
    ".xlsx": lambda f: UnstructuredExcelLoader(f, mode="elements"),
    ".pptx": lambda f: UnstructuredPowerPointLoader(f, mode="elements"),
}

# ── Splitter mirroring Spring AI TokenTextSplitter(400, 60, ...) ──────────────
splitter = TokenTextSplitter(
    chunk_size=400,
    chunk_overlap=60,
)

def get_qdrant_client() -> QdrantClient:
    return QdrantClient(url=QDRANT_URL)

def ensure_collection(client: QdrantClient, vector_size: int):
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
        print(f"Created collection: {COLLECTION_NAME}")

def ingest(filepath: str):
    ext = Path(filepath).suffix.lower()
    loader_fn = LOADERS.get(ext)

    if not loader_fn:
        print(f"ERROR: Unsupported file type: {ext}", file=sys.stderr)
        sys.exit(1)

    # Load
    docs = loader_fn(filepath).load()
    for doc in docs:
        doc.metadata["source"] = Path(filepath).name

    # Split — mirrors Spring AI TokenTextSplitter(400, 60, 5, 10000, true)
    chunks = splitter.split_documents(docs)

    # Embed using Ollama bge-m3 — same model as Java AssistantService
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL, base_url=OLLAMA_BASE_URL)

    # Probe vector size from the model so collection is created with correct dims
    sample_vector = embeddings.embed_query("probe")
    vector_size = len(sample_vector)

    client = get_qdrant_client()
    ensure_collection(client, vector_size)

    QdrantVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        url=QDRANT_URL,
        collection_name=COLLECTION_NAME,
    )

    print(f"OK:{len(chunks)}:{Path(filepath).name}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("ERROR: No file path provided", file=sys.stderr)
        sys.exit(1)
    ingest(sys.argv[1])
