"""
Qdrant Vector Store — Hybrid Search (Dense + Sparse) with RRF
==============================================================

Retrieval pipeline for Moroccan legal documents:

1. **Dense vectors** — BGE-M3 (via sentence-transformers) captures semantic
   meaning across Arabic, French, and English.
2. **Sparse vectors** — SPLADE PP (via fastembed) provides BM25-style keyword
   matching with IDF weighting for exact legal terminology.
3. **Reciprocal Rank Fusion (RRF)** — combines both result lists into a single
   ranked list, boosting documents that appear in both retrievers.

Why hybrid for legal search?
    Dense vectors understand that *"rights of the accused"* ≈ *"defendant
    protections"*, while sparse vectors match exact terms like *"Article 23"*
    or *"Code Pénal"*.  RRF fuses both signals so a document ranking high in
    *either* retriever gets boosted — more robust than naive score averaging.

Security
--------
All queries are scoped to a ``tenant_id`` filter, ensuring strict multi-tenant
data isolation at the Qdrant level.
"""
import logging
import uuid
from typing import Any, Dict, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    HnswConfigDiff,
    MatchValue,
    PointStruct,
    ScoredPoint,
    SparseIndexParams,
    SparseVector,
    SparseVectorParams,
    VectorParams,
)
from sentence_transformers import SentenceTransformer
from fastembed import SparseTextEmbedding

from app.config import settings
from app.services.chunker import Chunk, LegalDocumentChunker

logger = logging.getLogger(__name__)


class QdrantService:
    """
    Hybrid search service backed by Qdrant.

    Thread-safety
    -------------
    ``QdrantClient`` and ``SentenceTransformer`` are thread-safe for read
    operations (encoding, querying).  The ``add_document`` method builds a
    batch of points and upserts atomically.

    Performance
    -----------
    Embeddings are generated in **batch** (all chunks at once) rather than
    one-by-one, reducing GPU/CPU overhead.  All points for a document are
    upserted in a single network round-trip.
    """

    def __init__(
        self,
        *,
        qdrant_url: Optional[str] = None,
        qdrant_api_key: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> None:
        """
        Initialise clients, embedding models, and ensure the collection exists.

        Parameters
        ----------
        qdrant_url :
            Override for ``settings.qdrant_url``.
        qdrant_api_key :
            Override for ``settings.qdrant_api_key``.
        collection_name :
            Override for ``settings.qdrant_collection``.
        """
        self._collection_name = collection_name or settings.qdrant_collection

        # ------------------------------------------------------------------
        # Qdrant client — prefer gRPC for lower latency
        # ------------------------------------------------------------------
        self._client = QdrantClient(
            url=qdrant_url or settings.qdrant_url,
            api_key=qdrant_api_key or settings.qdrant_api_key,
            timeout=30,
        )

        # ------------------------------------------------------------------
        # Embedding models
        # ------------------------------------------------------------------
        # BGE-M3: 1024-dim multilingual dense embeddings (Arabic / FR / EN).
        # trust_remote_code=True is required because BGE-M3 uses custom code
        # on HuggingFace.  The model hash is pinned transitively by the model
        # name — if supply-chain integrity is a concern, download the model
        # offline and load from a local path.
        self._dense_model = SentenceTransformer(
            settings.dense_model_name,
            trust_remote_code=True,
        )

        # SPLADE PP: sparse embeddings that approximate BM25 with neural
        # term weighting (IDF-aware).
        self._sparse_model = SparseTextEmbedding(
            model_name=settings.sparse_model_name,
        )

        # ------------------------------------------------------------------
        # Document chunker
        # ------------------------------------------------------------------
        self._chunker = LegalDocumentChunker(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            min_chunk_size=settings.min_chunk_size,
        )

        # Ensure the Qdrant collection exists with hybrid vector config
        self._ensure_collection()

        logger.info(
            "QdrantService ready — collection='%s', dense='%s', sparse='%s'",
            self._collection_name,
            settings.dense_model_name,
            settings.sparse_model_name,
        )

    # ------------------------------------------------------------------
    # Collection management
    # ------------------------------------------------------------------

    def _ensure_collection(self) -> None:
        """Create the Qdrant collection with hybrid vector config if missing."""
        existing = {
            c.name for c in self._client.get_collections().collections
        }

        if self._collection_name in existing:
            logger.debug("Collection '%s' already exists", self._collection_name)
            return

        logger.info("Creating collection '%s'", self._collection_name)

        self._client.create_collection(
            collection_name=self._collection_name,
            vectors_config={
                "dense": VectorParams(
                    size=1024,  # BGE-M3 output dimension
                    distance=Distance.COSINE,
                    hnsw_config=HnswConfigDiff(m=16, ef_construct=100),
                ),
            },
            sparse_vectors_config={
                "sparse": SparseVectorParams(
                    index=SparseIndexParams(full_scan_threshold=10_000),
                ),
            },
        )

        logger.info("Collection '%s' created with hybrid (dense + sparse) config", self._collection_name)

    # ------------------------------------------------------------------
    # Embedding helpers
    # ------------------------------------------------------------------

    def _encode_dense(self, texts: List[str]) -> List[List[float]]:
        """
        Encode a batch of texts into BGE-M3 dense vectors.

        BGE-M3 produces 1024-dimensional vectors.  We normalise to unit
        length so that cosine similarity reduces to a dot product.
        """
        embeddings = self._dense_model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.tolist()

    def _encode_sparse(self, texts: List[str]) -> List[SparseVector]:
        """Encode a batch of texts into SPLADE sparse vectors."""
        results = list(self._sparse_model.embed(documents=texts))
        return [
            SparseVector(
                indices=emb.indices.tolist(),
                values=emb.values.tolist(),
            )
            for emb in results
        ]

    # ------------------------------------------------------------------
    # Document ingestion
    # ------------------------------------------------------------------

    def add_document(
        self,
        text: str,
        tenant_id: str,
        doc_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> List[str]:
        """
        Chunk, embed, and index a legal document.

        Pipeline
        --------
        1. Split text into article-level chunks via ``LegalDocumentChunker``.
        2. Generate dense + sparse embeddings for **all chunks in batch**.
        3. Build ``PointStruct`` objects with tenant-scoped metadata.
        4. Upsert all points in a single Qdrant call.

        Parameters
        ----------
        text :
            Raw document text (Arabic, French, or English).
        tenant_id :
            Multi-tenant isolation key.
        doc_id :
            Stable identifier for the parent document.
        metadata :
            Arbitrary key-value pairs (source, law_type, language, …).

        Returns
        -------
        List of deterministic UUID chunk IDs that were indexed.
        """
        # 1. Chunk
        chunks: List[Chunk] = self._chunker.chunk_document(
            text=text,
            metadata=metadata or {},
        )

        if not chunks:
            logger.warning("Document %s produced zero chunks — nothing to index", doc_id)
            return []

        logger.info("Document %s → %d chunks", doc_id, len(chunks))

        # 2. Batch encode all chunks at once (performance critical)
        chunk_texts = [c.content for c in chunks]
        dense_vectors = self._encode_dense(chunk_texts)
        sparse_vectors = self._encode_sparse(chunk_texts)

        # 3. Build points
        points: List[PointStruct] = []
        indexed_ids: List[str] = []

        for i, chunk in enumerate(chunks):
            # Deterministic UUID — same doc_id + index always produces the same ID
            chunk_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{doc_id}_chunk_{i}"))

            payload = {
                **metadata,
                **chunk.metadata,
                "parent_doc_id": doc_id,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "tenant_id": tenant_id,
                "content": chunk.content,
            }

            points.append(PointStruct(
                id=chunk_id,
                vector={"dense": dense_vectors[i], "sparse": sparse_vectors[i]},
                payload=payload,
            ))
            indexed_ids.append(chunk_id)

        # 4. Single batch upsert
        self._client.upsert(
            collection_name=self._collection_name,
            points=points,
        )

        logger.debug("Upserted %d points for document %s (tenant=%s)", len(points), doc_id, tenant_id)
        return indexed_ids

    # ------------------------------------------------------------------
    # Hybrid search with Reciprocal Rank Fusion
    # ------------------------------------------------------------------

    def search_hybrid_rrf(
        self,
        query: str,
        tenant_id: str,
        n_results: int = 5,
        dense_weight: float = 1.0,
        sparse_weight: float = 1.0,
    ) -> List[Dict[str, Any]]:
        """
        Hybrid search with Reciprocal Rank Fusion.

        RRF formula
        -----------
        ``RRF(d) = Σ 1 / (k + rank_i(d))``  where *k = 60*.

        Documents appearing in **both** dense and sparse result lists receive
        a compounded score, which is exactly what we want for legal queries
        that benefit from both semantic understanding and exact term matching.

        Parameters
        ----------
        query :
            User query in any supported language.
        tenant_id :
            Strict tenant isolation filter.
        n_results :
            Number of fused results to return.
        dense_weight / sparse_weight :
            Relative importance of each retriever (default: equal).

        Returns
        -------
        Ranked list of dicts with ``id``, ``content``, ``rrf_score``, and
        ``metadata`` (excluding the raw ``content`` field).
        """
        # Encode query
        dense_query = self._encode_dense([query])[0]
        sparse_query = self._encode_sparse([query])[0]

        # Tenant isolation filter
        tenant_filter = Filter(must=[
            FieldCondition(key="tenant_id", match=MatchValue(value=tenant_id)),
        ])

        # Retrieve from both vectors independently
        # We fetch 2× n_results so RRF has enough candidates to fuse
        fetch_limit = max(n_results * 2, 10)

        dense_points = self._client.query_points(
            collection_name=self._collection_name,
            query=dense_query,
            using="dense",
            query_filter=tenant_filter,
            limit=fetch_limit,
            with_payload=True,
        ).points

        sparse_point = self._client.query_points(
            collection_name=self._collection_name,
            query=sparse_query,
            using="sparse",
            query_filter=tenant_filter,
            limit=fetch_limit,
            with_payload=True,
        ).points

        # Fuse and return top-k
        fused = self._reciprocal_rank_fusion(
            dense_results=dense_points,
            sparse_results=sparse_point,
            k=60,
            dense_weight=dense_weight,
            sparse_weight=sparse_weight,
        )

        return fused[:n_results]

    @staticmethod
    def _reciprocal_rank_fusion(
        dense_results: List[ScoredPoint],
        sparse_results: List[ScoredPoint],
        k: int = 60,
        dense_weight: float = 1.0,
        sparse_weight: float = 1.0,
    ) -> List[Dict[str, Any]]:
        """
        Fuse two ranked result lists via Reciprocal Rank Fusion.

        For each document appearing in either list:
            ``score = weight / (k + rank + 1)``

        Documents in both lists accumulate scores from both retrievers.
        """
        rrf_scores: Dict[str, float] = {}
        doc_map: Dict[str, Dict[str, Any]] = {}

        for rank, result in enumerate(dense_results):
            doc_id = str(result.id)
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + dense_weight / (k + rank + 1)
            doc_map[doc_id] = _point_to_dict(result)

        for rank, result in enumerate(sparse_results):
            doc_id = str(result.id)
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + sparse_weight / (k + rank + 1)
            if doc_id not in doc_map:
                doc_map[doc_id] = _point_to_dict(result)

        # Sort descending by fused score
        ranked = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)

        return [
            {**doc_map[doc_id], "rrf_score": score}
            for doc_id, score in ranked
        ]

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    def health_check(self) -> bool:
        """Return True if Qdrant is reachable and the collection exists."""
        try:
            collections = {c.name for c in self._client.get_collections().collections}
            return self._collection_name in collections
        except Exception:
            logger.exception("Qdrant health check failed")
            return False


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _point_to_dict(point: ScoredPoint) -> Dict[str, Any]:
    """Convert a Qdrant ScoredPoint into a clean dict for API responses."""
    payload = point.payload or {}
    return {
        "id": str(point.id),
        "content": payload.get("content", ""),
        "score": point.score,
        "metadata": {k: v for k, v in payload.items() if k != "content"},
    }
