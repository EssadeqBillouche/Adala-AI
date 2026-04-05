"""
Pydantic request / response models for the AI engine API.

All models use Pydantic v2 syntax.  Field-level validators enforce input
constraints before any business logic runs (fail-fast principle).
"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator

# Maximum characters allowed in a single document ingestion request
_MAX_TEXT_LENGTH = 500_000  # ~500 KB


class LegalQueryRequest(BaseModel):
    """Request body for ``POST /v1/ask``."""

    question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Legal question in Arabic, French, or English",
    )
    tenant_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Tenant identifier for multi-tenant isolation",
    )
    n_results: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of documents to retrieve (1–20)",
    )
    stream: bool = Field(
        default=True,
        description="Return a streaming SSE response when true",
    )


class DocumentChunk(BaseModel):
    """A single retrieved document chunk returned to the client."""

    id: str
    content: str
    score: float
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LegalQueryResponse(BaseModel):
    """Response body for ``POST /v1/ask`` when ``stream=false``."""

    question: str
    answer: str
    documents: List[DocumentChunk] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)


class IngestDocumentRequest(BaseModel):
    """Request body for ``POST /v1/documents``."""

    text: str = Field(
        ...,
        min_length=1,
        description="Raw document text content",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Document metadata (source, law_type, language, …)",
    )
    doc_id: Optional[str] = Field(
        default=None,
        max_length=128,
        description="Optional stable document identifier",
    )

    @field_validator("text")
    @classmethod
    def text_not_too_long(cls, v: str) -> str:
        if len(v) > _MAX_TEXT_LENGTH:
            raise ValueError(
                f"Text exceeds maximum length of {_MAX_TEXT_LENGTH} characters "
                f"(got {len(v)})"
            )
        return v

    @field_validator("metadata")
    @classmethod
    def metadata_keys_are_safe(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """
        Reject metadata keys that could shadow internal fields.

        This prevents a client from overwriting ``tenant_id`` or ``content``
        in the Qdrant payload, which would break tenant isolation.
        """
        protected = {"tenant_id", "content", "parent_doc_id", "chunk_index", "total_chunks"}
        for key in v:
            if key in protected:
                raise ValueError(f"Metadata key '{key}' is reserved and cannot be set by the client")
        return v
