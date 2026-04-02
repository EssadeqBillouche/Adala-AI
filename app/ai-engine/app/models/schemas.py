"""
Pydantic models for AdalaAI Legal Engine request/response validation.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class LegalQueryRequest(BaseModel):
    """Request model for legal query endpoint."""
    question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The legal question in Arabic, French, or English"
    )
    tenant_id: str = Field(
        ...,
        min_length=1,
        description="Tenant identifier for multi-tenancy isolation"
    )
    n_results: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of documents to retrieve for RAG context"
    )
    stream: bool = Field(
        default=True,
        description="Whether to stream the response"
    )


class DocumentChunk(BaseModel):
    """Represents a retrieved legal document chunk."""
    id: str
    content: str
    score: float
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "doc_123",
                "content": "Article 1: The Constitution guarantees...",
                "score": 0.92,
                "metadata": {"article_number": "1", "source": "Moroccan Constitution"}
            }
        }


class LegalQueryResponse(BaseModel):
    """Response model for legal query endpoint (non-streaming)."""
    question: str
    answer: str
    documents: List[DocumentChunk] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "What are the rights of the accused?",
                "answer": "According to Article 23 of the Moroccan Constitution...",
                "documents": [],
                "sources": ["Moroccan Constitution - Article 23"]
            }
        }


class StreamChunk(BaseModel):
    """Individual chunk for streaming responses."""
    type: str = Field(..., description="Type of chunk: 'start', 'content', 'end', 'error'")
    content: Optional[str] = Field(default=None, description="Content for 'content' type chunks")
    documents: Optional[List[DocumentChunk]] = Field(default=None, description="Retrieved documents for 'end' type")
    error: Optional[str] = Field(default=None, description="Error message for 'error' type")


class IngestDocumentRequest(BaseModel):
    """Request model for document ingestion."""
    text: str = Field(..., min_length=1, description="Document text content")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Document metadata including article_number, source, law_type, etc."
    )
    doc_id: Optional[str] = Field(default=None, description="Optional document ID")
