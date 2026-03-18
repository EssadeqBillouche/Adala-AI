import chromadb
import uuid
import logging

logger = logging.getLogger(__name__)

class VectorStoreService:
    def __init__(self):
        # Initialize persistent ChromaDB storage in the local container directory
        self.client = chromadb.pres
        
        # In a SaaS context with Legal documents, a single shared collection 
        # is optimal IF we stringently use metadata filtering for multi-tenancy.
        self.collection = self.client.get_or_create_collection(
            name="legal_intelligence_docs",
            metadata={"hnsw:space": "cosine"} # Cosine similarity usually performs best for embeddings
        )
        logger.info("ChromaDB Vector Store Initialized.")

    def add_document(self, text: str, tenant_id: str, doc_id: str = None, extra_metadata: dict = None):
        """Indexes a document, enforcing the tenant_id directly into metadata."""
        if not doc_id:
            doc_id = str(uuid.uuid4())
            
        if extra_metadata is None:
            extra_metadata = {}
            
        # 🛡️ THE RLS EQUIVALENT FOR VECTOR DBS:
        # Hardcode the tenant metadata. Never trust client payload to supply this.
        secure_metadata = {
            **extra_metadata,
            "tenant_id": tenant_id
        }

        self.collection.upsert(
            documents=[text],
            metadatas=[secure_metadata],
            ids=[doc_id]
        )
        return doc_id

    def search(self, query: str, tenant_id: str, n_results: int = 5):
        """Finds similarity matches STRICTLY isolated to the given tenant."""
        
        # 🛡️ Enforce cross-tenant security using the native 'where' metadata filter
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"tenant_id": tenant_id}
        )
        
        return results
