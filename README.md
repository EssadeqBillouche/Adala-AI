# Adala AI

Adala AI is a multi-tenant legal intelligence platform for researching Moroccan law. It combines a Next.js workspace, a NestJS API, and a FastAPI retrieval-augmented generation (RAG) engine that searches legal documents and streams cited answers.

The platform is designed for legal teams that need organized research projects, persistent conversations, multilingual legal search, source management, and usage-aware billing.

## Highlights

- Secure organization-based tenancy with owner, admin, member, and viewer roles
- PostgreSQL Row-Level Security (RLS) for organization-scoped data isolation
- Email/password authentication with HTTP-only JWT cookies
- Projects, conversations, messages, legal sources, invitations, API keys, audit logs, and subscriptions
- Moroccan legal RAG with Arabic, French, and English support
- Hybrid dense and sparse retrieval using BGE-M3 and SPLADE with Reciprocal Rank Fusion
- Citation-oriented answers generated through a LangGraph workflow
- Server-Sent Events (SSE) streaming from the AI engine through the NestJS API
- Credit-ledger and subscription data models for usage tracking
- SaaS organization tiers, seat limits, billing metadata, and locale settings
- Swagger/OpenAPI documentation in non-production backend environments
- Docker Compose deployment behind an Nginx reverse proxy

## Architecture

```mermaid
flowchart LR
    Browser[Next.js frontend\n:3000] -->|/api/*| Nginx[Nginx\n:80]
    Nginx --> Frontend[Frontend container]
    Nginx --> Backend[NestJS API\n:4000]
    Backend --> PostgreSQL[(PostgreSQL\nexternal)]
    Backend -->|authenticated SSE relay| Engine[FastAPI AI engine\n:8000]
    Engine --> Qdrant[(Qdrant\nexternal)]
    Engine --> LLM[Gemini or\nOpenAI-compatible LLM]
    Engine --> Models[Local Hugging Face\nand FastEmbed models]
```

### Request flow

1. The browser calls the API through the same-origin `/api` path in the Compose deployment.
2. NestJS authenticates the request, resolves the organization tenant, and applies validation, throttling, and security middleware.
3. AI questions are forwarded to `POST /v1/ask` with the organization ID and optionally relayed as SSE events.
4. The AI engine searches tenant-isolated documents in Qdrant, generates an answer, and returns retrieved sources and citations.
5. Conversations and usage metadata are persisted by the NestJS API in PostgreSQL.

## PostgreSQL row-level security

The backend uses PostgreSQL RLS as a database-level tenant isolation control. TypeORM migrations create `tenant_isolation_policy` policies that compare each row's organization ID with the transaction-local setting `app.current_tenant_id`.

RLS is enabled for the following organization-scoped tables:

- `organizations` and `users`
- `projects`
- `conversations`, `messages`, `legal_sources`, and `message_citations`
- `invitations`
- `subscriptions`, `credit_ledgers`, `api_keys`, and `audit_logs`

The request tenant is taken from the authenticated user's organization ID by `TenantContextInterceptor`. Database operations that access secured data run through `TenancyService`, which validates the UUID and sets `app.current_tenant_id` with `SET LOCAL` for the current transaction. Several tables also use `FORCE ROW LEVEL SECURITY`, including organization, user, conversation, message, legal-source, citation, subscription, credit-ledger, API-key, and audit-log data.

RLS policies are installed by the backend migrations. Run the migrations against the target PostgreSQL database before relying on database-level tenant isolation in a production deployment. The service also rejects secured operations when the tenant context is missing or invalid.

## SaaS capabilities

Adala AI includes the backend foundations for a multi-tenant SaaS product:

- **Organizations and tiers:** Each tenant has a unique name and slug, a `FREE`, `PRO`, or `ENTERPRISE` tier, billing email, locale, logo URL, configurable maximum seats, and an SSO-enabled flag.
- **Team access:** Users belong to an organization and can hold `OWNER`, `ADMIN`, `MEMBER`, or `VIEWER` roles. Organization invitations support adding new members without exposing data across tenants.
- **Subscription records:** Each organization can have a subscription record containing Stripe customer, subscription, and price IDs, status (`ACTIVE`, `TRIALING`, `PAST_DUE`, or `CANCELED`), monthly credit allocation, billing period dates, trial information, and cancellation state.
- **Usage and credits:** The credit ledger records top-ups, spending, refunds, expirations, and bonuses with before/after balances, reasons, and idempotency keys. Balance and ledger queries are tenant-scoped.
- **API access:** Organization owners and administrators can create, list, update, revoke, and delete scoped API keys. Secret values are hashed and are only returned at creation time; keys also support scopes, rate limits, expiration, and last-used tracking.
- **Auditability:** Audit records capture the actor type, action, resource, JSON differences, IP address, user agent, and organization, with RLS protection.

These modules provide the current SaaS data model and API surface. Stripe payment processing, webhook handling, SSO provider integration, and automated plan enforcement are not provisioned by the included Compose stack and should be integrated before treating those capabilities as fully managed production billing or identity features.

## Repository layout

```text
app/
├── ai-engine/       FastAPI + LangGraph RAG service and document ingestion
├── backend/         NestJS API, authentication, tenancy, persistence, and billing
├── frontend/        Next.js user interface
├── nginx/           Reverse proxy and SSE configuration
└── docker-compose.yml
Docs/                UML architecture diagrams
UI/                  Design system and interface mockups
.github/             CI/CD workflows and setup notes
```

## Prerequisites

For local development:

- Node.js 20 or newer
- npm
- Python 3.11
- PostgreSQL database
- Qdrant instance (local or Qdrant Cloud)
- An LLM API key, unless using an OpenAI-compatible local/remote provider

For the containerized stack, install Docker and Docker Compose. PostgreSQL and Qdrant are external dependencies: the included Compose file intentionally does not start either service.

## Configuration

### AI engine

Create the AI engine environment file:

```bash
cp app/ai-engine/.env.example app/ai-engine/.env
```

At minimum, set the LLM and Qdrant values:

```dotenv
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
LLM_MODEL=gemini-2.0-flash
QDRANT_URL=https://your-qdrant-endpoint
QDRANT_API_KEY=your-qdrant-key
```

The default engine settings use port `8000`, collection `moroccan_legal_docs_hybrid`, BGE-M3 dense embeddings, SPLADE sparse embeddings, 512-character chunks, and 50-character overlap. `INTERNAL_API_SECRET` can be set to require an `X-API-Secret` header on non-health requests.

### Backend

Create `app/backend/.env` with the values required by the API configuration:

```dotenv
NODE_ENV=development
PORT=4000
Db_URL=postgresql://user:password@localhost:5432/adala_ai
JWT_SECRET=replace-with-a-long-random-secret
ALLOWED_ORIGINS=http://localhost:3000
AI_ENGINE_URL=http://localhost:8000
AI_ENGINE_TIMEOUT_MS=30000
# Keep this identical to the AI engine value when enabled.
# INTERNAL_API_SECRET=replace-with-a-long-random-secret
```

Use a strong secret in every shared or production environment. The backend uses `Db_URL` as the TypeORM connection URL. In development, TypeORM synchronization is enabled; production deployments should use migrations and set `NODE_ENV=production`.

### Frontend

The frontend defaults to `/api`, which is correct when accessed through Nginx. For direct local API access, create `app/frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
```

When using the Nginx Compose stack, leave this unset so browser requests use the `/api` proxy path.

## Quick start with Docker Compose

1. Start or provision an accessible PostgreSQL database and Qdrant instance.
2. Create and fill `app/backend/.env` and `app/ai-engine/.env` as described above.
3. Ensure the AI model caches exist. The AI Dockerfile copies `.model-cache/huggingface` and `.model-cache/fastembed` into the image.
4. Start the stack:

   ```bash
   cd app
   docker compose up --build
   ```

5. Open [http://localhost](http://localhost). Nginx is the only externally published service and routes `/` to Next.js and `/api/` to NestJS.

The AI engine health endpoints are `/health` and `/v1/health`. The backend health endpoint is `GET /health` when reached directly on port `4000`.

## Local development

Run each service in its own terminal.

### Backend

```bash
cd app/backend
npm ci
npm run start:dev
```

The API listens on `http://localhost:4000`. In development, Swagger is available at `http://localhost:4000/api`.

### Frontend

```bash
cd app/frontend
npm ci
npm run dev
```

The web application listens on `http://localhost:3000`.

### AI engine

```bash
cd app/ai-engine
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.main
```

The FastAPI documentation is available at `http://localhost:8000/docs` and `http://localhost:8000/redoc`.

## Document ingestion

The engine provides a document ingestion endpoint that chunks text at article boundaries, creates dense and sparse embeddings, and stores tenant-scoped vectors in Qdrant. Documents are limited to 500,000 characters per request.

```bash
curl -X POST http://localhost:8000/v1/documents \
  -H 'Content-Type: application/json' \
  -H 'X-Tenant-ID: YOUR_ORGANIZATION_ID' \
  -d '{
    "doc_id": "commercial-code",
    "text": "Your legal document text...",
    "metadata": {"language": "fr", "domain": "COMMERCIAL"}
  }'
```

The repository includes a sample Moroccan commercial code PDF at `app/ai-engine/data/raw/code_commerce_fr.pdf`. The ingestion utilities and model download helper are in `app/ai-engine/ingest_pdfs.py` and `app/ai-engine/download-models.sh`.

## API overview

The NestJS API is grouped into the following resources:

| Area | Main routes |
| --- | --- |
| Authentication | `/auth/register`, `/auth/login`, `/auth/profile`, `/auth/logout` |
| AI | `/ai/ask-stream` |
| Projects | `/projects` |
| Conversations and messages | `/conversations`, `/messages` |
| Legal sources | `/legal-sources` |
| Billing | `/subscription`, `/credit-ledger` |
| Organization access | `/invitations`, `/api-keys` |
| Auditing | `/audit-logs` |

The AI engine also exposes:

| Route | Purpose |
| --- | --- |
| `POST /v1/ask` | RAG answer, streamed by default or returned as JSON |
| `POST /v1/documents` | Tenant-scoped document ingestion |
| `GET /v1/search` | Hybrid search without LLM generation |
| `GET /v1/health` | Dependency-aware health status |
| `GET /health` | Lightweight container health check |

For the complete backend contract, use Swagger in development or import `app/backend/adala-ai-api.postman_collection.json` into Postman. The accompanying guide is available at `app/backend/postman_guide.md`.

## Testing and quality checks

### Backend

```bash
cd app/backend
npm run lint
npm test
npm run test:cov
npm run test:e2e
npm run build
```

### Frontend

```bash
cd app/frontend
npm run lint
npm test
npm run test:coverage
npm run build
```

### CI/CD

GitHub Actions workflows cover backend, frontend, and AI-engine checks. The deployment workflow builds container images, publishes them to GHCR, runs security scanning, and supports staging and production deployment. See [`.github/CI_CD_SETUP.md`](.github/CI_CD_SETUP.md) for required repository secrets and environment configuration.

## Security notes

- Authentication tokens are stored in HTTP-only cookies rather than browser-accessible storage.
- CORS is configured with explicit origins; wildcard origins are rejected by the AI engine.
- Helmet, validation pipes, request throttling, tenant context, and role guards are enabled in the backend.
- AI-engine requests can be protected with a shared internal secret in addition to Docker network isolation.
- Keep `.env` files, API keys, JWT secrets, and model credentials out of version control.
- Review and rotate external database, Qdrant, and LLM credentials before deployment.

## Design and architecture references

- [UML class diagram](Docs/UML_ClassDiagram.png)
- [UML component diagram](Docs/UML_Component.png)
- [UML sequence diagram](Docs/UML_Sequence.jpg)
- [UML use-case diagram](Docs/UML_USECASE.png)
- [Juris-Artisan design system](UI/design.md)
- [Interface mockups](UI/)

## Project status

Adala AI is an actively developed application. Integrations with PostgreSQL, Qdrant, and external LLM providers require environment-specific credentials and infrastructure. Validate authentication, tenancy, billing, and document access policies in a staging environment before production use.

## License

No open-source license is currently declared for this repository. Contact the project owners regarding usage and distribution terms.
