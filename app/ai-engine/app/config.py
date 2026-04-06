"""
Centralized configuration with validation.

All environment variables are read once at startup and validated.
This prevents scattered os.getenv() calls and catches misconfiguration early.

Usage:
    from app.config import settings
    url = settings.qdrant_url
"""
import logging
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Validation runs at startup — if any required value is missing or
    malformed the application refuses to start (fail-fast principle).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore unknown env vars instead of crashing
    )

    # =========================================================================
    # Server
    # =========================================================================
    host: str = Field(default="0.0.0.0", description="Bind address")
    port: int = Field(default=8000, ge=1, le=65535, description="Bind port")
    log_level: str = Field(default="INFO", description="Logging level")
    cors_origins: str = Field(
        default="http://localhost:3000",
        description="Comma-separated list of allowed CORS origins",
    )

    # =========================================================================
    # Qdrant
    # =========================================================================
    qdrant_url: str = Field(
        default="https://localhost:6333",
        description="Qdrant server URL (cloud or local)",
    )
    qdrant_api_key: str | None = Field(
        default=None,
        description="Qdrant API key (required for Qdrant Cloud)",
    )
    qdrant_collection: str = Field(
        default="moroccan_legal_docs_hybrid",
        description="Qdrant collection name for legal documents",
    )

    # =========================================================================
    # LLM
    # =========================================================================
    llm_provider: Literal["gemini", "openai_compatible"] = Field(
        default="gemini",
        description="LLM backend: 'gemini' or 'openai_compatible'",
    )
    gemini_api_key: str | None = Field(
        default=None,
        description="Google Gemini API key (required when llm_provider=gemini)",
    )
    llm_api_url: str | None = Field(
        default=None,
        description="OpenAI-compatible API endpoint (used when llm_provider=openai_compatible)",
    )
    llm_api_key: str | None = Field(
        default=None,
        description="API key for OpenAI-compatible provider",
    )
    llm_model: str = Field(
        default="gemini-2.0-flash",
        description="Model identifier for the chosen LLM provider",
    )

    # =========================================================================
    # Embedding models (advanced — defaults are production-ready)
    # =========================================================================
    dense_model_name: str = Field(
        default="BAAI/bge-m3",
        description="Sentence-Transformers model for dense vectors",
    )
    sparse_model_name: str = Field(
        default="prithivida/Splade_PP_en_v1",
        description="FastEmbed sparse model for BM25-style sparse vectors",
    )

    # =========================================================================
    # Chunking
    # =========================================================================
    chunk_size: int = Field(default=512, ge=64, description="Target chunk size in characters")
    chunk_overlap: int = Field(default=50, ge=0, description="Overlap between chunks in characters")
    min_chunk_size: int = Field(default=100, ge=10, description="Minimum chunk size to keep")

    # =========================================================================
    # Security
    # =========================================================================
    internal_api_secret: str | None = Field(
        default=None,
        description=(
            "Shared secret between NestJS backend and this AI engine. "
            "When set, every request must include a valid X-API-Secret header. "
            "Leave unset in Docker Compose deployments where network isolation is sufficient."
        ),
    )

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        valid = ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL")
        upper = v.upper()
        if upper not in valid:
            raise ValueError(f"log_level must be one of {valid}, got '{v}'")
        return upper

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, v: str) -> str:
        origins = [o.strip() for o in v.split(",") if o.strip()]
        for origin in origins:
            if origin == "*":
                raise ValueError(
                    "CORS origin '*' is not allowed. "
                    "List explicit origins (e.g., 'http://localhost:3000')."
                )
            if not origin.startswith(("http://", "https://")):
                raise ValueError(f"CORS origin must start with http:// or https://: {origin}")
        return v

    def validate_llm_config(self) -> None:
        """
        Cross-field LLM validation.

        Called during startup after settings are loaded.
        Raises ValueError if the chosen provider is missing its required key.
        """
        if self.llm_provider == "gemini" and not self.gemini_api_key:
            raise ValueError(
                "GEMINI_API_KEY is required when LLM_PROVIDER=gemini. "
                "Get one at https://aistudio.google.com/apikey"
            )
        if self.llm_provider == "openai_compatible" and not self.llm_api_url:
            raise ValueError(
                "LLM_API_URL is required when LLM_PROVIDER=openai_compatible"
            )

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse the comma-separated CORS origins string into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Cached settings factory — returns the same Settings instance on every call.

    The lru_cache ensures we only parse environment variables once at startup.
    Use `get_settings.cache_clear()` in tests to reload.
    """
    return Settings()


# Module-level convenience import
settings: Settings = get_settings()
