"""
AdalaAI — Moroccan Legal Intelligence Engine
=============================================
Production FastAPI service providing:

• Hybrid Search (BGE-M3 dense + SPLADE sparse) with Reciprocal Rank Fusion
• Multilingual embeddings (Arabic / French / English)
• LangGraph RAG workflow with strict citation requirements
• Streaming SSE responses for real-time answer generation

Architecture
------------
This service is designed to run on an internal Docker network behind Nginx.
The NestJS backend (app/backend) authenticates users and forwards queries
to this engine.  Multi-tenancy is enforced via the ``X-Tenant-ID`` header.

Security
--------
When ``INTERNAL_API_SECRET`` is set in the environment, every request must
include a matching ``X-API-Secret`` header.  In Docker Compose deployments
the default is to leave this unset and rely on network isolation instead.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.api.routes import router as legal_rag_router

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Optional shared-secret authentication middleware
# ---------------------------------------------------------------------------
class InternalAuthMiddleware(BaseHTTPMiddleware):
    """
    Enforce a shared secret on every request when configured.

    This protects the AI engine from unauthenticated access if the service
    is ever exposed beyond the internal Docker network.

    Clients must send:  X-API-Secret: <INTERNAL_API_SECRET>
    """

    async def dispatch(self, request: Request, call_next):
        secret = settings.internal_api_secret

        # Skip auth for health checks and when no secret is configured
        if secret is None or request.url.path in ("/health", "/v1/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        provided = request.headers.get("X-API-Secret", "")
        if not provided or provided != secret:
            logger.warning("Rejected request with invalid/missing X-API-Secret from %s", request.client.host)
            raise HTTPException(status_code=401, detail="Unauthorized: invalid or missing X-API-Secret")

        return await call_next(request)


# ---------------------------------------------------------------------------
# Application lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup / shutdown lifecycle.

    During startup we:
    1. Validate LLM configuration (fail fast if keys are missing)
    2. Pre-load the Qdrant service (downloads BGE-M3 ~2.3 GB on first run)
       so that the first user request does not time out.
    """
    logger.info("🏛️  AdalaAI Legal Engine starting")

    # Validate LLM config before loading heavy models
    settings.validate_llm_config()
    logger.info("✓ LLM configuration validated (provider=%s, model=%s)", settings.llm_provider, settings.llm_model)

    # Pre-initialize Qdrant service (loads BGE-M3 model into memory)
    # Import here to avoid circular imports at module load time
    from app.services.qdrant_service import QdrantService
    from app.rag.legal_rag_workflow import LegalRAGWorkflow

    app.state.qdrant_service = QdrantService()
    logger.info("✓ Qdrant service initialized — collection '%s'", settings.qdrant_collection)

    app.state.rag_workflow = LegalRAGWorkflow(qdrant_service=app.state.qdrant_service)
    logger.info("✓ RAG workflow initialized")

    logger.info("✅ AdalaAI Legal Engine ready — listening on %s:%d", settings.host, settings.port)

    yield

    logger.info("AdalaAI Legal Engine shutting down")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AdalaAI — Moroccan Legal Intelligence Engine",
    description=(
        "Production-ready AI engine for Moroccan legal research.\n\n"
        "- **Hybrid Search**: BGE-M3 dense + SPLADE sparse vectors with RRF fusion\n"
        "- **Multilingual**: Arabic, French, and English\n"
        "- **LangGraph RAG**: retrieve → generate pipeline with strict citations\n"
        "- **Streaming**: Server-Sent Events for real-time answers"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — restricted to configured origins only
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Optional shared-secret auth (enabled when INTERNAL_API_SECRET is set)
if settings.internal_api_secret:
    app.add_middleware(InternalAuthMiddleware)
    logger.info("🔒 Internal API secret authentication enabled")

# Routers
app.include_router(legal_rag_router)


# ---------------------------------------------------------------------------
# Root-level health check (for Docker / load balancers)
# ---------------------------------------------------------------------------

@app.get("/health")
async def root_health() -> dict:
    """Minimal health check — does not probe Qdrant (used by Docker healthcheck)."""
    return {"status": "ok", "service": "Adala AI Engine"}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
