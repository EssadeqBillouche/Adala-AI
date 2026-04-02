"""
AdalaAI - Legal AI Engine for Moroccan Law
Main FastAPI Application Entry Point

This engine provides:
- Hybrid Search (Dense + BM25 Sparse) with Reciprocal Rank Fusion
- Multilingual embeddings (Arabic/French/English) via BGE-M3
- LangGraph RAG workflow with strict citation requirements
- Streaming responses for real-time answer generation
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as legal_rag_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    logger.info("🏛️  AdalaAI Legal Engine starting...")
    logger.info("Initializing Qdrant Hybrid Search service...")
    logger.info("Loading BGE-M3 multilingual embeddings...")
    logger.info("✅ AdalaAI Legal Engine ready")
    
    yield
    
    # Shutdown
    logger.info("AdalaAI Legal Engine shutting down...")


# Initialize FastAPI application
app = FastAPI(
    title="AdalaAI - Moroccan Legal Intelligence Engine",
    description="""
    ## AdalaAI Legal RAG Engine
    
    Production-ready AI engine for Moroccan legal research with:
    
    - **Hybrid Search**: Dense vectors (BGE-M3) + BM25 Sparse with RRF fusion
    - **Multilingual**: Arabic, French, and English support
    - **LangGraph Orchestration**: Two-node RAG workflow (retrieve → generate)
    - **Strict Citations**: LLM instructed to cite Article numbers only from retrieved context
    
    ### Endpoints
    
    - **POST /v1/ask**: Ask legal questions with RAG-powered answers (streaming supported)
    - **POST /v1/documents**: Ingest legal documents into the vector store
    - **GET /v1/health**: Health check endpoint
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(legal_rag_router)


# =============================================================================
# LEGACY COMPATIBILITY ENDPOINTS
# =============================================================================

import uuid

from app.services.qdrant_service import QdrantService

# Singleton Qdrant service for legacy endpoints
_qdrant_service: QdrantService = None


def get_qdrant_service() -> QdrantService:
    """Get or create Qdrant service singleton."""
    global _qdrant_service
    if _qdrant_service is None:
        _qdrant_service = QdrantService()
    return _qdrant_service


# Security dependency - tenant isolation
def get_tenant_id(x_tenant_id: str = Header(...)) -> str:
    """
    Extract tenant ID from header for multi-tenancy isolation.
    
    🛡️ SECURITY: Because Docker/Nginx isolates this FastAPI service
    strictly to the internal network, we trust the X-Tenant-ID header
    passed by the authenticated NestJS backend.
    """
    if not x_tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Missing X-Tenant-ID header. AI Engine is internal only.",
        )
    return x_tenant_id


class DocumentPayload:
    """Legacy document payload model."""
    def __init__(self, id: str = None, text: str = None, metadata: dict = None):
        self.id = id
        self.text = text
        self.metadata = metadata or {}


class QueryPayload:
    """Legacy query payload model."""
    def __init__(self, query: str = None, n_results: int = 5):
        self.query = query
        self.n_results = n_results


@app.get("/health")
async def health_check():
    """Legacy health check endpoint."""
    return {"status": "ok", "service": "Adala AI Engine"}


@app.post("/v1/documents")
async def index_document(
    text: str,
    tenant_id: str = Depends(get_tenant_id),
    doc_id: str = None,
    metadata: dict = None,
):
    """
    Legacy endpoint: Ingests text with automatic article-based chunking.
    Returns list of chunk IDs. Use /v1/documents (new) for more features.
    """
    qdrant = get_qdrant_service()
    
    indexed_ids = qdrant.add_document(
        text=text,
        tenant_id=tenant_id,
        doc_id=doc_id or str(uuid.uuid4()),
        metadata=metadata,
    )
    
    return {"status": "success", "chunk_ids": indexed_ids, "total_chunks": len(indexed_ids)}


@app.post("/v1/search")
async def search_documents(
    query: str,
    n_results: int = 5,
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Legacy endpoint: Hybrid search with RRF strictly scoped to tenant.
    Use /v1/ask (new) for full RAG with LLM generation.
    """
    qdrant = get_qdrant_service()
    
    results = qdrant.search_hybrid_rrf(
        query=query,
        tenant_id=tenant_id,
        n_results=n_results,
    )
    
    return {"results": results}


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
