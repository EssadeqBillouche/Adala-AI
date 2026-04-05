"""
FastAPI route handlers for the AI engine.

All endpoints require a valid ``X-Tenant-ID`` header for multi-tenant isolation.
When ``INTERNAL_API_SECRET`` is configured, requests must also include a matching
``X-API-Secret`` header (enforced by middleware in ``main.py``).
"""
import json
import logging
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    DocumentChunk,
    IngestDocumentRequest,
    LegalQueryRequest,
    LegalQueryResponse,
)
from app.services.qdrant_service import QdrantService
from app.rag.legal_rag_workflow import LegalRAGWorkflow

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["legal-rag"])

# Maximum document text length accepted (characters) — prevents memory exhaustion
_MAX_INGEST_TEXT_LENGTH = 500_000  # ~500 KB


# ---------------------------------------------------------------------------
# Dependency helpers — read services from app.state (set during lifespan)
# ---------------------------------------------------------------------------

def _get_qdrant_service(request: Request) -> QdrantService:
    """Return the singleton QdrantService created at startup."""
    return request.app.state.qdrant_service


def _get_rag_workflow(request: Request) -> LegalRAGWorkflow:
    """Return the singleton LegalRAGWorkflow created at startup."""
    return request.app.state.rag_workflow


# ---------------------------------------------------------------------------
# POST /v1/ask  —  RAG-powered legal question answering
# ---------------------------------------------------------------------------

@router.post("/ask", response_model=None)
async def ask_legal_question(
    request: Request,
    body: LegalQueryRequest,
    rag_workflow: LegalRAGWorkflow = Depends(_get_rag_workflow),
) -> StreamingResponse | LegalQueryResponse:
    """
    Ask a legal question and receive a RAG-powered answer with citations.

    **Streaming** (``stream=true``, default):
        Server-Sent Events with retrieved documents first, then answer chunks.

    **Non-streaming** (``stream=false``):
        Single JSON response with the full answer and source documents.
    """
    try:
        if body.stream:
            return StreamingResponse(
                _stream_answer(body, rag_workflow),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                },
            )

        # Non-streaming
        result = rag_workflow.invoke(
            question=body.question,
            tenant_id=body.tenant_id,
            n_results=body.n_results,
        )

        documents = [
            DocumentChunk(
                id=doc["id"],
                content=doc["content"],
                score=doc.get("rrf_score", doc.get("score", 0.0)),
                metadata=doc.get("metadata", {}),
            )
            for doc in result["documents"]
        ]

        return LegalQueryResponse(
            question=result["question"],
            answer=result["answer"],
            documents=documents,
            sources=result.get("sources", []),
        )

    except Exception as exc:
        logger.exception("Error in /ask endpoint")
        if body.stream:
            async def _error_stream() -> AsyncGenerator[str, None]:
                yield f"data: {json.dumps({'type': 'error', 'error': str(exc)})}\n\n"
            return StreamingResponse(_error_stream(), media_type="text/event-stream")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


async def _stream_answer(
    body: LegalQueryRequest,
    rag_workflow: LegalRAGWorkflow,
) -> AsyncGenerator[str, None]:
    """Yield SSE events for the streaming RAG response."""
    try:
        async for event in rag_workflow.invoke_stream(
            question=body.question,
            tenant_id=body.tenant_id,
            n_results=body.n_results,
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
    except Exception as exc:
        logger.exception("Streaming error in /ask")
        yield f"data: {json.dumps({'type': 'error', 'error': str(exc)})}\n\n"


# ---------------------------------------------------------------------------
# POST /v1/documents  —  Ingest a legal document
# ---------------------------------------------------------------------------

@router.post("/documents")
async def ingest_document(
    request: Request,
    body: IngestDocumentRequest,
    x_tenant_id: str = Header(..., min_length=1, description="Tenant identifier"),
    qdrant_service: QdrantService = Depends(_get_qdrant_service),
) -> dict:
    """
    Ingest a legal document into the vector store.

    The document is automatically split into article-level chunks using
    ``LegalDocumentChunker``, embedded with BGE-M3 + SPLADE, and indexed
    in Qdrant with tenant isolation.
    """
    # Input validation — reject oversized documents
    if len(body.text) > _MAX_INGEST_TEXT_LENGTH:
        raise HTTPException(
            status_code=413,
            detail=f"Document too large: {len(body.text)} chars (max {_MAX_INGEST_TEXT_LENGTH})",
        )

    doc_id = body.doc_id or str(uuid.uuid4())

    try:
        indexed_ids = qdrant_service.add_document(
            text=body.text,
            tenant_id=x_tenant_id,
            doc_id=doc_id,
            metadata=body.metadata,
        )

        logger.info(
            "Document %s ingested → %d chunks for tenant %s",
            doc_id, len(indexed_ids), x_tenant_id,
        )

        return {
            "status": "success",
            "document_id": doc_id,
            "chunk_ids": indexed_ids,
            "total_chunks": len(indexed_ids),
            "message": "Document auto-chunked and indexed successfully",
        }

    except Exception as exc:
        logger.exception("Document ingestion error")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest document: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# GET /v1/health  —  Health check
# ---------------------------------------------------------------------------

@router.get("/health")
async def health_check(
    qdrant_service: QdrantService = Depends(_get_qdrant_service),
) -> dict:
    """Return the health status of the AI engine and its dependencies."""
    qdrant_healthy = qdrant_service.health_check()

    return {
        "status": "healthy" if qdrant_healthy else "degraded",
        "services": {
            "qdrant": "up" if qdrant_healthy else "down",
        },
    }


# ---------------------------------------------------------------------------
# GET /v1/search  —  Hybrid search without LLM generation
# ---------------------------------------------------------------------------

@router.get("/search")
async def search_documents(
    query: str,
    n_results: int = 5,
    x_tenant_id: str = Header(..., min_length=1, description="Tenant identifier"),
    qdrant_service: QdrantService = Depends(_get_qdrant_service),
) -> dict:
    """
    Perform hybrid search and return ranked results without LLM generation.

    Example:
        GET /v1/search?query=دين+الدولة&n_results=5
    """
    if n_results < 1 or n_results > 50:
        raise HTTPException(status_code=400, detail="n_results must be between 1 and 50")

    results = qdrant_service.search_hybrid_rrf(
        query=query,
        tenant_id=x_tenant_id,
        n_results=n_results,
    )

    return {"results": results}
