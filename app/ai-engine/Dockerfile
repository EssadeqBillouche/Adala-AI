# =============================================================================
# AdalaAI Engine — Dockerfile
# Uses pre-downloaded models from local .model-cache directory.
# This avoids downloading models during every Docker build.
# =============================================================================

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Copy pre-downloaded models from local cache
COPY .model-cache/huggingface /root/.cache/huggingface/
COPY .model-cache/fastembed /root/.cache/fastembed/

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
