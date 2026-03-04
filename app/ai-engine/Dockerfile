FROM python:3.11-slim AS base

WORKDIR /app

# System deps (if you need more, add them here)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source
COPY app ./app

# Default port for API
EXPOSE 8000

# Adjust this command to how you actually run the service
CMD ["python", "-m", "app.main"]