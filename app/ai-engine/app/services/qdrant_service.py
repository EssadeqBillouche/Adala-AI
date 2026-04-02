"""
Qdrant Vector Store Service with Hybrid Search (Dense + BM25 Sparse).
Implements Reciprocal Rank Fusion (RRF) for combining dense and sparse search results.
"""
import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    SparseVector,
    SparseVectorParams,
    SparseIndexParams,
    Filter,
    FieldCondition,
    MatchValue,
    HnswConfigDiff,
)
from fastembed import SparseTextEmbedding, TextEmbedding

logger = logging.getLogger(__name__)

# BGE-M3 embedding dimensions
DENSE_DIMENSION = 1024

# Collection name for Moroccan legal documents
COLLECTION_NAME = "moroccan_legal_docs_hybrid"


class QdrantService:
    """
    Qdrant service implementing Hybrid Search with:
    - Dense vectors using BGE-M3 for semantic similarity
    - BM25 Sparse vectors for keyword matching with IDF weighting
    - Reciprocal Rank Fusion (RRF) for result combination
    """

    def __init__(
        self,
        qdrant_url: Optional[str] = None,
        qdrant_api_key: Optional[str] = None,
        collection_name: str = COLLECTION_NAME,
    ):
        """
        Initialize Qdrant client and ensure collection exists with hybrid search config.
        
        Args:
            qdrant_url: Qdrant server URL (default: local http://localhost:6333)
            qdrant_api_key: API key for authentication
            collection_name: Name of the collection to use
        """
        self.collection_name = collection_name
        
        # Initialize Qdrant client
        self.client = QdrantClient(
            url=qdrant_url or os.getenv("QDRANT_URL", "http://localhost:6333"),
            api_key=qdrant_api_key or os.getenv("QDRANT_API_KEY"),
        )
        
        # Initialize embedding models
        # BGE-M3: Multilingual model supporting Arabic, French, English
        self.dense_model = TextEmbedding(model_name="BAAI/bge-m3")
        self.sparse_model = SparseTextEmbedding(model_name="prithvida/Splade_PP_en_v1")
        
        # Ensure collection exists with hybrid search configuration
        self._ensure_collection()
        
        logger.info("Qdrant Hybrid Search Service initialized successfully")

    def _ensure_collection(self) -> None:
        """
        Create collection if not exists with Hybrid Search configuration:
        - Dense vector: BGE-M3 embeddings (1024 dimensions)
        - Sparse vector: BM25 with IDF modifier for keyword boosting
        """
        collections = self.client.get_collections().collections
        
        if not any(c.name == self.collection_name for c in collections):
            logger.info(f"Creating collection: {self.collection_name}")
            
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config={
                    # Dense vector configuration for semantic search
                    "dense": VectorParams(
                        size=DENSE_DIMENSION,
                        distance=Distance.COSINE,
                        hnsw_config=HnswConfigDiff(
                            m=16,  # Number of edges per node
                            ef_construct=100,  # Size of dynamic candidate list
                        ),
                    ),
                    # Sparse vector configuration for BM25 keyword search
                    "sparse": SparseVectorParams(
                        index=SparseIndexParams(
                            # Full scan for sparse vectors (optimal for BM25)
                            full_scan_threshold=10000,
                        )
                    ),
                },
            )
            
            logger.info(f"Collection '{self.collection_name}' created with Hybrid Search support")

    def _generate_dense_embedding(self, text: str) -> List[float]:
        """Generate dense embedding using BGE-M3 model."""
        embeddings = list(self.dense_model.embed(texts=[text]))
        return embeddings[0].tolist()

    def _generate_sparse_embedding(self, text: str) -> SparseVector:
        """
        Generate sparse BM25 embedding.
        BM25 uses IDF (Inverse Document Frequency) modifier internally,
        which boosts rare/unique terms and downweights common terms.
        """
        embeddings = list(self.sparse_model.embed(texts=[text]))
        sparse_emb = embeddings[0]
        return SparseVector(
            indices=sparse_emb.indices.tolist(),
            values=sparse_emb.values.tolist(),
        )

    def add_document(
        self,
        text: str,
        tenant_id: str,
        doc_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Add a document to Qdrant with both dense and sparse vectors.
        
        Args:
            text: Document text content
            tenant_id: Tenant identifier for multi-tenancy
            doc_id: Unique document identifier
            metadata: Additional metadata (article_number, source, law_type, etc.)
        
        Returns:
            The document ID
        """
        # Generate embeddings
        dense_vector = self._generate_dense_embedding(text)
        sparse_vector = self._generate_sparse_embedding(text)
        
        # Prepare metadata with tenant isolation
        full_metadata = {
            **(metadata or {}),
            "tenant_id": tenant_id,
            "content": text,  # Store original content in metadata for retrieval
        }
        
        # Create point with both vector types
        point = PointStruct(
            id=doc_id,
            vector={
                "dense": dense_vector,
                "sparse": sparse_vector,
            },
            payload=full_metadata,
        )
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=[point],
        )
        
        logger.debug(f"Document {doc_id} indexed for tenant {tenant_id}")
        return doc_id

    def search_hybrid_rrf(
        self,
        query: str,
        tenant_id: str,
        n_results: int = 5,
        dense_weight: float = 1.0,
        sparse_weight: float = 1.0,
    ) -> List[Dict[str, Any]]:
        """
        Perform Hybrid Search using Reciprocal Rank Fusion (RRF).
        
        RRF LOGIC (for project presentation):
        -------------------------
        Reciprocal Rank Fusion combines results from multiple retrieval methods
        by computing a fused score based on reciprocal ranks:
        
            RRF_score(d) = Σ (1 / (k + rank_i(d)))
        
        Where:
        - k = 60 (constant, prevents division by zero, smooths ranking)
        - rank_i(d) = position of document d in result list i
        
        WHY RRF FOR LEGAL SEARCH:
        1. Dense vectors capture SEMANTIC meaning (e.g., "accused rights" ≈ "defendant protections")
        2. Sparse/BM25 captures EXACT legal terminology (e.g., "Article 23", "Code Pénal")
        3. RRF balances both: A document ranking high in EITHER method gets boosted
        4. More robust than simple score averaging (different scales, distributions)
        
        Args:
            query: Search query text
            tenant_id: Tenant identifier for filtering
            n_results: Number of results to return
            dense_weight: Weight for dense search results
            sparse_weight: Weight for sparse search results
        
        Returns:
            List of retrieved documents with scores and metadata
        """
        # Generate query embeddings
        dense_query = self._generate_dense_embedding(query)
        sparse_query = self._generate_sparse_embedding(query)
        
        # Create tenant filter for multi-tenancy isolation
        tenant_filter = Filter(
            must=[
                FieldCondition(
                    key="tenant_id",
                    match=MatchValue(value=tenant_id),
                )
            ]
        )
        
        # Search dense vectors (semantic similarity)
        dense_results = self.client.search(
            collection_name=self.collection_name,
            query_vector=("dense", dense_query),
            query_filter=tenant_filter,
            limit=n_results * 2,  # Get more for RRF fusion
            with_payload=True,
        )
        
        # Search sparse vectors (BM25 keyword matching)
        sparse_results = self.client.search(
            collection_name=self.collection_name,
            query_vector=("sparse", sparse_query),
            query_filter=tenant_filter,
            limit=n_results * 2,
            with_payload=True,
        )
        
        # Apply Reciprocal Rank Fusion
        fused_results = self._reciprocal_rank_fusion(
            dense_results=dense_results,
            sparse_results=sparse_results,
            k=60,  # Standard RRF constant
            dense_weight=dense_weight,
            sparse_weight=sparse_weight,
        )
        
        # Return top n_results
        return fused_results[:n_results]

    def _reciprocal_rank_fusion(
        self,
        dense_results: List,
        sparse_results: List,
        k: int = 60,
        dense_weight: float = 1.0,
        sparse_weight: float = 1.0,
    ) -> List[Dict[str, Any]]:
        """
        Implement Reciprocal Rank Fusion to combine dense and sparse search results.
        
        Algorithm:
        1. For each document in both result lists, compute RRF score
        2. RRF_score = (dense_weight / (k + dense_rank)) + (sparse_weight / (k + sparse_rank))
        3. Sort by fused score descending
        4. Documents appearing in both lists get boosted (ideal for legal search)
        
        Example: If "Article 23" appears at rank 3 in dense and rank 1 in sparse:
            RRF = (1.0 / (60 + 3)) + (1.0 / (60 + 1)) = 0.0159 + 0.0164 = 0.0323
        """
        rrf_scores: Dict[str, float] = {}
        doc_map: Dict[str, Dict[str, Any]] = {}
        
        # Process dense results
        for rank, result in enumerate(dense_results):
            doc_id = str(result.id)
            rrf_score = dense_weight / (k + rank + 1)  # +1 for 1-based ranking
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + rrf_score
            
            doc_map[doc_id] = {
                "id": doc_id,
                "content": result.payload.get("content", ""),
                "score": result.score,
                "metadata": {k: v for k, v in result.payload.items() if k != "content"},
            }
        
        # Process sparse results
        for rank, result in enumerate(sparse_results):
            doc_id = str(result.id)
            rrf_score = sparse_weight / (k + rank + 1)
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + rrf_score
            
            # Update doc_map if not already present
            if doc_id not in doc_map:
                doc_map[doc_id] = {
                    "id": doc_id,
                    "content": result.payload.get("content", ""),
                    "score": result.score,
                    "metadata": {k: v for k, v in result.payload.items() if k != "content"},
                }
        
        # Sort by RRF score descending
        sorted_docs = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
        
        # Build final results with fused scores
        final_results = []
        for doc_id, rrf_score in sorted_docs:
            doc_info = doc_map[doc_id]
            doc_info["rrf_score"] = rrf_score
            final_results.append(doc_info)
        
        return final_results

    def health_check(self) -> bool:
        """Check if Qdrant service is healthy."""
        try:
            self.client.get_collections()
            return True
        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")
            return False
