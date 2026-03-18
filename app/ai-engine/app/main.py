from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict
from app.services.vector_store import VectorStoreService

app = FastAPI(title="Adala AI Engine - Vector Search")

vector_store = VectorStoreService()

# 🛡️ SECURITY DEPENDENCY:
# Because Docker/Nginx isolates this FastAPI service strictly to the internal network,
# we confidently trust the X-Tenant-ID header passed by the authenticated NestJS backend.
def get_tenant_id(x_tenant_id: str = Header(...)):
    if not x_tenant_id:
         raise HTTPException(status_code=400, detail="Missing X-Tenant-ID header. AI Engine is internal only.")
    return x_tenant_id

class DocumentPayload(BaseModel):
    id: Optional[str] = None
    text: str
    metadata: Dict = {}

class QueryPayload(BaseModel):
    query: str
    n_results: int = 5

@app.get("/health")
async def health_check():
     return {"status": "ok", "service": "Adala AI Engine"}

@app.post("/v1/documents")
async def index_document(payload: DocumentPayload, tenant_id: str = Depends(get_tenant_id)):
 """ Ingests text completely siloed by the injected Tenant ID Header from NestJS."""
 
 doc_id = vector_store.add_document(
        text=payload.text,
        tenant_id=tenant_id,
        doc_id=payload.id,
        extra_metadata=payload.metadata
        )
 return {"status": "success", "indexed_id": doc_id}

@app.post("/v1/search")

async def search_documents(payload: QueryPayload, tenant_id: str = Depends(get_tenant_id)):

    """

    Looks up legal context strictly scoped to the querying tenant's metadata partition.

    """

    results = vector_store.search(

        query=payload.query,

        tenant_id=tenant_id,

        n_results=payload.n_results

    )

    return {"results": results}