FROM python:3.11-slim

WORKDIR /app

# System dependencies:
#   build-essential  — compile native extensions (fastembed, qdrant-client)
#   curl             — Docker healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install CPU-only PyTorch to avoid pulling ~4 GB of CUDA libraries
RUN pip install --no-cache-dir -r requirements.txt \
    --extra-index-url https://download.pytorch.org/whl/cpu

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
