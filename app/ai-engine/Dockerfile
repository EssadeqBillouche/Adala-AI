FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for:
# - Building native libraries (fastembed, qdrant-client)
# - Curl for healthcheck
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Qdrant stores vectors externally (in qdrant service), no local storage needed

COPY . .

EXPOSE 8000

# Let uvicorn bind to all interfaces directly so docker routing resolves it.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
