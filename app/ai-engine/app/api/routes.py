"""
FastAPI routes for AdalaAI Legal Engine.
Provides /ask endpoint with streaming support for RAG queries.
"""
import json
import logging
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    LegalQueryRequest,
    LegalQueryResponse,
    DocumentChunk,
    StreamChunk,
    IngestDocumentRequest,
)
from app.services.qdrant_service import QdrantService
from app.rag.legal_rag_workflow import LegalRAGWorkflow

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["legal-rag"])


# =============================================================================
# DEPENDENCIES
# =============================================================================

def get_qdrant_service() -> QdrantService:
    """Dependency injection for Qdrant service (singleton pattern)."""
    return QdrantService()


def get_rag_workflow(qdrant_service: QdrantService = Depends(get_qdrant_service)) -> LegalRAGWorkflow:
    """Dependency injection for RAG workflow."""
    return LegalRAGWorkflow(qdrant_service=qdrant_service)


# =============================================================================
# ROUTES
# =============================================================================

@router.post("/ask")
async def ask_legal_question(
    request: LegalQueryRequest,
    rag_workflow: LegalRAGWorkflow = Depends(get_rag_workflow),
) -> StreamingResponse | LegalQueryResponse:
    """
    Ask a legal question with RAG-powered answer.
    
    This endpoint:
    1. Retrieves relevant Moroccan legal documents using Hybrid Search (RRF)
    2. Generates an answer with strict citation requirements
    3. Returns streaming or non-streaming response based on request
    
    Streaming format (Server-Sent Events):
        data: {"type": "documents", "documents": [...], "sources": [...]}
        data: {"type": "answer_chunk", "content": "According to Article..."}
        data: {"type": "answer_chunk", "content": "23..."}
        data: {"type": "end"}
    """
    try:
        if request.stream:
            return StreamingResponse(
                _stream_answer(request, rag_workflow),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",  # Disable nginx buffering
                },
            )
        else:
            # Non-streaming response
            result = rag_workflow.invoke(
                question=request.question,
                tenant_id=request.tenant_id,
                n_results=request.n_results,
            )
            
            documents = [
                DocumentChunk(
                    id=doc["id"],
                    content=doc["content"],
                    score=doc.get("rrf_score", doc.get("score", 0)),
                    metadata=doc.get("metadata", {}),
                )
                for doc in result["documents"]
            ]
            
            return LegalQueryResponse(
                question=result["question"],
                answer=result["answer"],
                documents=documents,
                sources=result["sources"],
            )
            
    except Exception as e:
        logger.error(f"Error in /ask endpoint: {e}")
        if request.stream:
            # Return error as stream
            async def error_stream():
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            return StreamingResponse(error_stream(), media_type="text/event-stream")
        else:
            raise HTTPException(status_code=500, detail=str(e))


async def _stream_answer(
    request: LegalQueryRequest,
    rag_workflow: LegalRAGWorkflow,
) -> AsyncGenerator[str, None]:
    """
    Generator for streaming RAG response.
    Uses Server-Sent Events (SSE) format.
    """
    try:
        async for event in rag_workflow.invoke_stream(
            question=request.question,
            tenant_id=request.tenant_id,
            n_results=request.n_results,
        ):
            # Format as SSE
            yield f"data: {json.dumps(event)}\n\n"
            
    except Exception as e:
        logger.error(f"Streaming error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"


@router.post("/documents")
async def ingest_document(
    request: IngestDocumentRequest,
    x_tenant_id: str = Header(..., description="Tenant ID from authenticated backend"),
    qdrant_service: QdrantService = Depends(get_qdrant_service),
) -> dict:
    """
    Ingest a legal document into the vector store.
    
    Document metadata should include:
    - article_number: The article number (e.g., "23")
    - source: The law source (e.g., "Moroccan Constitution")
    - law_type: Type of law (e.g., "constitutional", "penal", "civil")
    """
    import uuid
    
    doc_id = request.doc_id or str(uuid.uuid4())
    
    try:
        indexed_id = qdrant_service.add_document(
            text=request.text,
            tenant_id=x_tenant_id,
            doc_id=doc_id,
            metadata=request.metadata,
        )
        
        logger.info(f"Document {indexed_id} ingested for tenant {x_tenant_id}")
        
        return {
            "status": "success",
            "indexed_id": indexed_id,
            "message": "Document indexed successfully",
        }
        
    except Exception as e:
        logger.error(f"Document ingestion error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to ingest document: {str(e)}")


@router.get("/health")
async def health_check(
    qdrant_service: QdrantService = Depends(get_qdrant_service),
) -> dict:
    """Health check endpoint for the AI engine."""
    qdrant_healthy = qdrant_service.health_check()
    
    return {
        "status": "healthy" if qdrant_healthy else "degraded",
        "services": {
            "qdrant": "up" if qdrant_healthy else "down",
        },
    }
