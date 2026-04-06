# AdalaAI — Moroccan Legal Intelligence Platform

> AI-powered legal research, consultation, and case management platform built for the Moroccan legal system.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Qdrant-Cloud-FF465E?logo=qdrant" alt="Qdrant Cloud" />
  <img src="https://img.shields.io/badge/LangGraph-0.2-4169E1" alt="LangGraph" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [PDF Ingestion Pipeline](#pdf-ingestion-pipeline)
- [API Reference](#api-reference)
- [RAG Pipeline](#rag-pipeline)
- [Multi-Tenancy](#multi-tenancy)
- [Security](#security)
- [Development](#development)
- [Project Structure](#project-structure)
- [License](#license)

---

## Overview

**AdalaAI** (مجلس — *Majlis*) is a full-stack legal intelligence platform designed for Moroccan legal professionals. It combines:

- **AI Legal Assistant** — RAG-powered legal consultation with strict citation requirements and anti-hallucination guards
- **Case Management** — End-to-end case tracking, project organization, and client management
- **Legal Library** — Searchable database of Moroccan laws, penal codes, and regulations
- **Subscription Management** — Tiered access with free trial and premium plans

The system processes Moroccan legal documents in **Arabic, French, and English**, understanding the unique structure of official bulletins, legal codes, and court decisions.

---

## Architecture

```
                          ┌─────────────┐
                          │   Internet   │
                          └──────┬──────┘
                                 │ Port 80
                          ┌──────▼──────┐
                          │   NGINX      │  ← Reverse proxy, gzip, security headers
                          │  (Alpine)    │     client_max_body_size: 50M
                          └──┬───────┬──┘
                     /       │       │    /api/
              (Next.js HMR)  │       │
                             │       │
                    ┌────────▼┐  ┌───▼────────────┐
                    │Frontend │  │    Backend       │
                    │ Next.js │  │   NestJS 11     │
                    │  :3000  │  │    :4000         │
                    └────────┘  │  ┌───────────┐   │
                                │  │PostgreSQL │   │
                                │  │  TypeORM  │   │
                                │  └───────────┘   │
                                └────────┬─────────┘
                                         │ AI_ENGINE_URL
                                  ┌──────▼──────────────┐
                                  │    AI Engine         │
                                  │   FastAPI :8000      │
                                  │  ┌────────────────┐  │
                                  │  │  LangGraph RAG  │  │
                                  │  │ retrieve→generate│ │
                                  │  └────────────────┘  │
                                  └──────┬───────────────┘
                                         │
                                  ┌──────▼──────────────┐
                                  │   Qdrant Cloud       │
                                  │  Hybrid Vector DB    │
                                  │  (dense + sparse)    │
                                  └─────────────────────┘
```

**Four internal Docker services** behind a single NGINX gateway — only port 80 is exposed externally.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 + React 19 + TypeScript | UI/UX with App Router, SSR/SSG |
| **Styling** | Tailwind CSS v4 + Material Design tokens | Responsive, accessible design |
| **Backend** | NestJS 11 + TypeScript | Auth, orchestration, multi-tenancy |
| **Database** | PostgreSQL + TypeORM | User data, cases, conversations |
| **AI Engine** | FastAPI + LangGraph | RAG pipeline, LLM orchestration |
| **Vector DB** | Qdrant Cloud | Hybrid semantic + keyword search |
| **Embeddings** | BGE-M3 (dense) + SPLADE PP (sparse) | Multilingual vector encoding |
| **LLM** | Google Gemini 2.0 Flash (default) or any OpenAI-compatible API | Response generation |
| **PDF Processing** | Docling 2.x + HybridChunker | Legal document parsing & chunking |
| **Reverse Proxy** | NGINX (Alpine) | Routing, gzip, security headers, SSE timeouts |

---

## Key Features

### 🤖 AI Legal Consultation
- **Hybrid RAG search** — Dense (semantic) + Sparse (keyword) vectors fused via Reciprocal Rank Fusion (k=60)
- **Multi-lingual** — Understands Arabic, French, and English legal queries simultaneously
- **Anti-hallucination** — LLM instructed to answer *only* from retrieved context
- **Strict citation** — Every answer must cite specific Article numbers from Moroccan law
- **SSE streaming** — Real-time token-by-token response delivery

### 📄 Document Ingestion
- **Docling-powered conversion** — PDFs → Markdown with preserved tables, reading order, and multi-column layout
- **OCR support** — Scanned PDFs processed via EasyOCR backend
- **Legal-aware chunking** — Recognizes Article boundaries (`المادة X`, `Article X`) for natural split points
- **Batch processing** — Progress bars, error recovery, per-file reporting

### 👥 Multi-Tenancy
- **Tenant isolation** — Every Qdrant query scoped by `tenant_id` filter
- **Row-Level Security** — PostgreSQL RLS policies on the NestJS side
- **Cookie-based auth** — HTTP-only JWT cookies, no localStorage tokens

### 🔒 Security
- **NGINX security headers** — X-Frame-Options, X-XSS-Protection, X-Content-Type-Options, HSTS
- **Helmet.js** on NestJS — Content Security Policy, DNS prefetch control
- **Optional API secret** — `X-API-Secret` header validation between Backend ↔ AI Engine
- **Rate limiting** — NestJS Throttler module
- **CORS strict mode** — Explicit origin list, no wildcards allowed

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Docker** | 24+ | With Compose plugin (`docker compose`) |
| **Git** | 2.30+ | For cloning and version control |
| **Python** | 3.11+ | Only needed for local PDF ingestion (outside Docker) |
| **Google Gemini API Key** | — | Get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Qdrant Cloud Account** | — | Sign up at [cloud.qdrant.io](https://cloud.qdrant.io) |

---

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url> adala-ai
cd adala-ai/app
```

### 2. Configure environment variables

```bash
# AI Engine — fill in your API keys
cp ai-engine/.env.example ai-engine/.env

# Backend — configure database and secrets
cp backend/.env.example backend/.env   # if template exists
```

Edit `ai-engine/.env` with your credentials:

```env
# Qdrant Cloud
QDRANT_URL=https://your-cluster-id.us-east.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-cloud-api-key-here

# Gemini (get key at https://aistudio.google.com/apikey)
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Start all services

```bash
docker compose up --build -d
```

This builds and starts all four containers:

| Service | Internal Port | External | Description |
|---------|--------------|----------|-------------|
| `nginx` | 80 | **http://localhost** | Entry point |
| `frontend` | 3000 | — | Next.js web app |
| `backend` | 4000 | — | NestJS API |
| `ai-engine` | 8000 | — | FastAPI RAG engine |

### 4. Verify the deployment

```bash
# Check all containers are healthy
docker compose ps

# Test AI engine health
curl http://localhost/api/v1/health

# Open the app
open http://localhost
```

### 5. Ingest legal documents

Place PDFs in `ai-engine/data/raw/` and run the ingestion pipeline:

```bash
cd ai-engine
pip install -r requirements.txt
python ingest_pdfs.py
```

See [PDF Ingestion Pipeline](#pdf-ingestion-pipeline) for advanced options.

---

## Configuration

### AI Engine (`ai-engine/.env`)

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `HOST` | `0.0.0.0` | No | Bind address |
| `PORT` | `8000` | No | Bind port |
| `LOG_LEVEL` | `INFO` | No | One of: DEBUG, INFO, WARNING, ERROR, CRITICAL |
| `CORS_ORIGINS` | `http://localhost:3000` | No | Comma-separated allowed origins (no `*`) |
| `QDRANT_URL` | — | **Yes** | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | — | **Yes** | Qdrant Cloud API key |
| `QDRANT_COLLECTION` | `moroccan_legal_docs_hybrid` | No | Collection name in Qdrant |
| `LLM_PROVIDER` | `gemini` | No | `gemini` or `openai_compatible` |
| `GEMINI_API_KEY` | — | If Gemini | Google Gemini API key |
| `LLM_MODEL` | `gemini-2.0-flash` | No | Model identifier |
| `LLM_API_URL` | — | If OAI compat. | OpenAI-compatible endpoint |
| `LLM_API_KEY` | — | If OAI compat. | API key for OAI-compatible provider |
| `INTERNAL_API_SECRET` | — | No | Shared secret for Backend ↔ AI Engine auth |
| `CHUNK_SIZE` | `512` | No | Max tokens per chunk |
| `CHUNK_OVERLAP` | `50` | No | Overlap between chunks |

### Using a Local LLM (Ollama)

Switch to any OpenAI-compatible provider:

```env
LLM_PROVIDER=openai_compatible
LLM_API_URL=http://host.docker.internal:11434/api/chat
LLM_API_KEY=
LLM_MODEL=qwen2.5-72b-instruct
```

---

## PDF Ingestion Pipeline

The ingestion pipeline replaces raw PDF processing with a modern Docling-based workflow:

```
PDF → Docling (Markdown + tables + reading order)
    → HybridChunker (respects Article/Section boundaries)
    → BGE-M3 + SPLADE embeddings (batch)
    → Qdrant Cloud (single batch upsert)
```

### Basic usage

```bash
cd ai-engine

# Install dependencies (Python 3.11+)
pip install -r requirements.txt

# Ingest all PDFs in data/raw/
python ingest_pdfs.py
```

### Advanced options

```bash
# Single file
python ingest_pdfs.py --file data/raw/code_commerce_fr.pdf

# Custom tenant ID
python ingest_pdfs.py --tenant-id my_law_firm

# Enable OCR for scanned PDFs (requires docling[easyocr])
pip install "docling[easyocr]"
python ingest_pdfs.py --enable-ocr

# Custom chunk size
python ingest_pdfs.py --max-tokens 256

# Custom input directory
python ingest_pdfs.py --input-dir /path/to/pdfs
```

### CLI reference

| Flag | Default | Description |
|------|---------|-------------|
| `--file` | — | Process a single PDF file |
| `--input-dir` | `data/raw/` | Directory containing PDF files |
| `--tenant-id` | `default` | Qdrant tenant ID for isolation |
| `--enable-ocr` | `false` | Enable OCR for scanned documents |
| `--max-tokens` | `512` | Max tokens per HybridChunker chunk |

### Supported PDF features

- **Tables** → Markdown tables (preserved by Docling)
- **Multi-column layouts** → Reading order auto-detected
- **Scanned documents** → OCR via EasyOCR (`--enable-ocr`)
- **Mixed languages** → Arabic, French, English auto-detected from filename
- **Legal structure** → `Article X`, `المادة X`, `Titre`, `Chapitre`, `Section` boundaries recognized

---

## API Reference

The AI Engine exposes a REST API under the `/v1` prefix, accessible through NGINX at `/api/v1/*`.

### Health Check

```
GET /api/v1/health
```

Returns Qdrant connectivity status and collection info.

**Response:**
```json
{
  "status": "healthy",
  "qdrant_connected": true,
  "collection": "moroccan_legal_docs_hybrid",
  "collection_exists": true
}
```

### Ask a Legal Question

```
POST /api/v1/ask
Headers: X-Tenant-ID: <tenant_id>
         Content-Type: application/json
```

**Request body:**
```json
{
  "question": "What are the penalties for breach of contract under Moroccan law?",
  "streaming": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | Yes | Legal query in any supported language |
| `streaming` | boolean | No | `true` for SSE streaming (default: `true`) |

**Streaming response** (`text/event-stream`):
```
event: documents
data: {"sources": [{"source": "code_commerce_fr.pdf", ...}], "document_count": 5}

event: answer_chunk
data: {"content": "Under Moroccan Commercial Code, "}

event: answer_chunk
data: {"content": "Article 102 states that..."}

event: end
data: {}
```

**Non-streaming response** (`application/json`):
```json
{
  "question": "What are the penalties...",
  "answer": "Under Moroccan Commercial Code, Article 102 states...",
  "documents": [
    {
      "content": "...",
      "score": 0.89,
      "metadata": { "source": "code_commerce_fr.pdf", "parent_doc_id": "code_commerce_fr" }
    }
  ],
  "sources": ["code_commerce_fr.pdf"]
}
```

### Hybrid Search (without LLM)

```
GET /api/v1/search?query=breach+of+contract&n_results=10
Headers: X-Tenant-ID: <tenant_id>
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | **Required** | Search query |
| `n_results` | int | `5` | Number of results (1–50) |

### Ingest a Document

```
POST /api/v1/documents
Headers: X-Tenant-ID: <tenant_id>
         Content-Type: application/json
```

**Request body:**
```json
{
  "doc_id": "penal_code_2024",
  "text": "Article 1: The following provisions apply...\nArticle 2: ...",
  "metadata": {
    "source": "penal_code_2024.pdf",
    "law_type": "Moroccan Penal Code",
    "language": "fr"
  }
}
```

> **Note:** Max 500,000 characters per request. For batch ingestion, use the `ingest_pdfs.py` script instead.

---

## RAG Pipeline

### Retrieval — Hybrid Search with RRF

The system uses **two complementary retrievers** fused via Reciprocal Rank Fusion:

```
                    User Query
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
    ┌─────────────────┐  ┌──────────────────┐
    │  Dense Retrieval│  │ Sparse Retrieval │
    │   (BGE-M3)      │  │  (SPLADE PP)     │
    │   1024-dim      │  │  BM25-style      │
    │   Semantic      │  │  Keyword/IDF     │
    └────────┬────────┘  └────────┬─────────┘
             │                    │
             ▼                    ▼
    ┌─────────────────────────────────────┐
    │   Reciprocal Rank Fusion (k=60)     │
    │   RRF(d) = Σ 1 / (60 + rank_i(d))  │
    └─────────────────┬───────────────────┘
                      │
                      ▼
          Ranked Documents (top-k)
```

| Retriever | Model | What it catches |
|-----------|-------|----------------|
| **Dense** | `BAAI/bge-m3` (1024-dim, COSINE) | Semantic similarity — *"rights of the accused"* ≈ *"defendant protections"* |
| **Sparse** | `prithivida/Splade_PP_en_v1` | Exact terminology — *"Article 23"*, *"Code Pénal"*, specific legal terms |

### Generation — LangGraph 2-Node Workflow

```
question ──► retrieve_node ──► generate_node ──► answer
             (Hybrid RRF)      (LLM + citations)
```

1. **`retrieve_node`** — Runs hybrid search, returns top documents with source labels
2. **`generate_node`** — Formats context into a structured prompt, calls the LLM

**System prompt enforces:**
- Answer **only** from retrieved context
- Cite specific Article numbers when available
- Focus on Moroccan law
- Respond in the same language as the query
- If no relevant documents found, return a fallback (never hallucinate)

### Anti-Hallucination Design

The generation node includes a strict system prompt that instructs the LLM to:
1. Base the answer **exclusively** on the provided legal context
2. Cite specific article numbers and legal sources
3. Explicitly state when the context doesn't contain enough information
4. Never invent or assume legal provisions not present in the retrieved documents

---

## Multi-Tenancy

AdalaAI supports multiple independent organizations (law firms, courts, ministries) on a single deployment.

| Layer | Mechanism |
|-------|-----------|
| **Qdrant** | Every vector point includes a `tenant_id` field. All queries apply a `tenant_id` filter. |
| **PostgreSQL** | Row-Level Security (RLS) policies via NestJS `nestjs-cls` for request-scoped tenant context. |
| **API** | Every `/v1/*` request requires an `X-Tenant-ID` header. |

---

## Security

| Layer | Measure |
|-------|---------|
| **NGINX** | `X-Frame-Options: DENY`, `X-XSS-Protection: 1`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy: no-referrer` |
| **Backend** | Helmet.js (CSP, DNS prefetch, no-sniff), rate limiting via `@nestjs/throttler`, HTTP-only JWT cookies |
| **AI Engine** | Optional `X-API-Secret` header validation (`INTERNAL_API_SECRET` env var) |
| **CORS** | Explicit origin list only — wildcard `*` is rejected at startup |
| **Upload limit** | `client_max_body_size 50M` at NGINX level |
| **SSE timeouts** | 3600s proxy timeouts for LLM streaming |

---

## Development

### Run services individually

```bash
# Frontend only (with hot reload)
docker compose up frontend -d
cd frontend && npm run dev

# Backend only
docker compose up backend -d
cd backend && npm run start:dev

# AI Engine only (outside Docker, for debugging)
cd ai-engine
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Run tests

```bash
# Backend (NestJS — 390+ unit tests)
cd backend && npm test

# Frontend (Jest + React Testing Library)
cd frontend && npm test
```

### Build Docker images

```bash
docker compose build          # Build all services
docker compose build ai-engine  # Build only AI Engine
docker compose build backend    # Build only Backend
```

### Download embedding models (optional)

Models are pre-cached in `.model-cache/`. To re-download:

```bash
cd ai-engine
chmod +x download-models.sh
./download-models.sh
```

This downloads:
- **BGE-M3** (~2.3 GB) — Dense multilingual embeddings
- **SPLADE PP** (~500 MB) — Sparse keyword vectors

---

## Project Structure

```
app/
├── docker-compose.yml              # Orchestrates all 4 services
├── nginx/
│   └── nginx.conf                  # Reverse proxy, security headers, gzip
├── frontend/                       # Next.js 16 web application
│   ├── app/
│   │   ├── layout.tsx              # Root layout + AuthProvider
│   │   ├── page.tsx                # Landing page
│   │   ├── auth/
│   │   │   ├── login/page.tsx      # Login (redirects if authenticated)
│   │   │   └── signup/page.tsx     # Signup (redirects if authenticated)
│   │   ├── dashboard/page.tsx      # Protected dashboard
│   │   ├── consult-ai/page.tsx     # Protected AI consultation
│   │   ├── legal-library/page.tsx  # Protected legal library
│   │   ├── case-tracker/page.tsx   # Protected case management
│   │   └── subscription/page.tsx   # Subscription management
│   ├── context/
│   │   └── AuthContext.tsx         # Cookie-based auth context
│   ├── components/
│   │   └── ProtectedRoute.tsx      # Client-side auth guard
│   └── lib/
│       └── api.ts                  # API client with interceptors
├── backend/                        # NestJS 11 orchestration
│   ├── src/
│   │   ├── auth/                   # JWT + Passport auth
│   │   ├── users/                  # User management
│   │   ├── projects/               # Case/project management
│   │   ├── conversations/          # Chat history
│   │   ├── subscriptions/          # Subscription & billing
│   │   └── ...
│   └── test/                       # 390+ unit tests
└── ai-engine/                      # FastAPI RAG engine
    ├── app/
    │   ├── main.py                 # FastAPI app + lifespan + middleware
    │   ├── config.py               # Pydantic settings with validation
    │   ├── api/
    │   │   └── routes.py           # REST endpoints (/v1/*)
    │   ├── rag/
    │   │   └── legal_rag_workflow.py  # LangGraph retrieve→generate
    │   ├── services/
    │   │   ├── qdrant_service.py   # Hybrid search (dense+sparse+RRF)
    │   │   └── chunker.py          # Legal-aware document chunking
    │   └── models/
    │       └── schemas.py          # Pydantic request/response models
    ├── data/
    │   └── raw/                    # Drop PDFs here for ingestion
    ├── .model-cache/               # Pre-downloaded embedding models
    ├── ingest_pdfs.py              # PDF ingestion pipeline CLI
    ├── download-models.sh          # Model download script
    ├── requirements.txt            # Python dependencies
    ├── Dockerfile                  # CPU-only Python 3.11 image
    ├── .env                        # Environment config (gitignored)
    └── .env.example                # Config template
```

---

## License

[MIT](LICENSE)

---

<p align="center">
  Built with ❤️ for the Moroccan legal community
</p>
