# =============================================================================
# AdalaAI Engine — Dockerfile
# Multi-stage build: models are downloaded during CI build and baked into
# the production image. This ensures:
#   1. Fast, reliable container startup (no runtime downloads)
#   2. Reproducible, self-contained images
#   3. CI layer caching makes subsequent builds instant
# =============================================================================

# ── Stage 1: Download models (cached by Docker/CI layer cache) ──────────────
FROM python:3.11-slim AS model-downloader
WORKDIR /models

RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Download models with retries — Docker caches this layer on success.
# In CI, the layer is restored from GitHub Actions cache.
RUN python3 << 'EOF'
import sys

def download_with_retry(description, fn, retries=5):
    for i in range(retries):
        try:
            print(f"  [{description}] Attempt {i+1}/{retries}")
            fn()
            print(f"  [{description}] ✓ Done")
            return
        except Exception as e:
            print(f"  [{description}] ✗ {e}")
            if i == retries - 1:
                sys.exit(1)

print("=== Downloading BGE-M3 dense model (~2.3 GB) ===")
download_with_retry("BGE-M3", lambda: __import__("sentence_transformers").SentenceTransformer(
    "BAAI/bge-m3", trust_remote_code=True
))

print("=== Downloading SPLADE PP sparse model (~500 MB) ===")
download_with_retry("SPLADE", lambda: (
    lambda m: list(m.embed(documents=["test"]))
)(__import__("fastembed").SparseTextEmbedding(model_name="prithivida/Splade_PP_en_v1"))
)

print("=== All models downloaded successfully ===")
EOF

# ── Stage 2: Production image ──────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Copy cached models from Stage 1
COPY --from=model-downloader /root/.cache/huggingface /root/.cache/huggingface
COPY --from=model-downloader /root/.cache/fastembed /root/.cache/fastembed

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
