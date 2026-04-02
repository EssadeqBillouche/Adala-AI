"""
LangGraph RAG Workflow for AdalaAI Legal Engine.
Implements a two-node workflow: retrieve_node -> generate_node
"""
import os
import logging
from typing import TypedDict, List, Dict, Any, Optional, Annotated
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
import httpx

from app.services.qdrant_service import QdrantService

logger = logging.getLogger(__name__)


# =============================================================================
# STATE DEFINITION
# =============================================================================
class AgentState(TypedDict):
    """
    LangGraph state schema for the legal RAG workflow.
    Tracks the question, retrieved documents, and generated answer.
    """
    question: str
    tenant_id: str
    documents: List[Dict[str, Any]]
    answer: str
    sources: List[str]
    error: Optional[str]


# =============================================================================
# SYSTEM PROMPT FOR MOROCCAN LEGAL CONTEXT
# =============================================================================
MOROCCAN_LEGAL_SYSTEM_PROMPT = """
You are AdalaAI, an expert legal assistant specializing in Moroccan law.

CRITICAL INSTRUCTIONS:
1. ONLY answer based on the retrieved Moroccan legal context provided below.
2. ALWAYS cite specific Article numbers when referencing laws (e.g., "According to Article 23...").
3. If the retrieved context does not contain relevant information, state: "Based on the available Moroccan legal documents, I cannot find specific information about this topic."
4. Do NOT fabricate, hallucinate, or invent Article numbers or legal provisions.
5. Respond in the same language as the user's question (Arabic, French, or English).
6. Be precise and cite the source law (e.g., "Moroccan Constitution", "Code de la Famille", "Code Pénal").

RETRIEVED LEGAL CONTEXT:
{context}

USER QUESTION:
{question}

Provide a comprehensive answer citing relevant Articles:
"""


# =============================================================================
# NODE IMPLEMENTATIONS
# =============================================================================

class LegalRAGWorkflow:
    """
    LangGraph-based RAG workflow for Moroccan legal queries.
    
    Workflow Architecture:
    ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
    │   Input     │ --> │ retrieve_node│ --> │ generate_node│ --> Output
    │  (question) │     │  (Hybrid RRF)│     │  (LLM + Citations)│
    └─────────────┘     └──────────────┘     └──────────────┘
    """

    def __init__(
        self,
        qdrant_service: Optional[QdrantService] = None,
        llm_api_url: Optional[str] = None,
        llm_api_key: Optional[str] = None,
        llm_model: str = "qwen2.5-72b-instruct",
    ):
        """
        Initialize the Legal RAG Workflow.
        
        Args:
            qdrant_service: Qdrant service instance for retrieval
            llm_api_url: URL of the LLM API endpoint
            llm_api_key: API key for LLM authentication
            llm_model: Model name to use for generation
        """
        self.qdrant_service = qdrant_service or QdrantService()
        self.llm_api_url = llm_api_url or os.getenv("LLM_API_URL", "http://localhost:11434/api/chat")
        self.llm_api_key = llm_api_key or os.getenv("LLM_API_KEY")
        self.llm_model = llm_model or os.getenv("LLM_MODEL", "qwen2.5-72b-instruct")
        
        # Build the LangGraph workflow
        self.graph = self._build_graph()
        logger.info("Legal RAG Workflow initialized")

    def _build_graph(self) -> StateGraph:
        """
        Construct the LangGraph workflow with two nodes:
        1. retrieve_node: Performs hybrid search with RRF
        2. generate_node: Generates answer with citations
        """
        # Initialize state graph
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("retrieve_node", self._retrieve_node)
        workflow.add_node("generate_node", self._generate_node)
        
        # Define edges (workflow flow)
        workflow.set_entry_point("retrieve_node")
        workflow.add_edge("retrieve_node", "generate_node")
        workflow.add_edge("generate_node", END)
        
        # Compile the graph
        return workflow.compile()

    def _retrieve_node(self, state: AgentState) -> AgentState:
        """
        Retrieve Node: Performs Hybrid Search using Qdrant's RRF.
        
        This node:
        1. Takes the user question and tenant_id from state
        2. Queries Qdrant with both dense (semantic) and sparse (BM25) vectors
        3. Applies Reciprocal Rank Fusion to combine results
        4. Updates state with retrieved documents
        
        RRF ensures we capture both:
        - Semantic similarity (e.g., "rights of accused" matches "defendant protections")
        - Exact legal terms (e.g., "Article 23", "Code Pénal Marocain")
        """
        try:
            question = state["question"]
            tenant_id = state["tenant_id"]
            
            logger.info(f"Retrieving documents for question: {question[:50]}...")
            
            # Perform hybrid search with RRF
            documents = self.qdrant_service.search_hybrid_rrf(
                query=question,
                tenant_id=tenant_id,
                n_results=5,
            )
            
            # Extract sources for citation
            sources = []
            for doc in documents:
                metadata = doc.get("metadata", {})
                article = metadata.get("article_number", "")
                source = metadata.get("source", "")
                if article and source:
                    sources.append(f"{source} - Article {article}")
                elif source:
                    sources.append(source)
            
            logger.info(f"Retrieved {len(documents)} documents")
            
            return {
                **state,
                "documents": documents,
                "sources": sources,
            }
            
        except Exception as e:
            logger.error(f"Retrieve node error: {e}")
            return {
                **state,
                "documents": [],
                "sources": [],
                "error": f"Retrieval failed: {str(e)}",
            }

    def _generate_node(self, state: AgentState) -> AgentState:
        """
        Generate Node: Produces answer with strict citation requirements.
        
        This node:
        1. Formats retrieved documents into context
        2. Constructs prompt with Moroccan legal system instructions
        3. Calls LLM API for generation
        4. Updates state with generated answer
        
        The system prompt ENFORCES:
        - Answers ONLY from retrieved context
        - Mandatory Article number citations
        - No hallucination of legal provisions
        """
        try:
            question = state["question"]
            documents = state["documents"]
            
            # Handle case where no documents were retrieved
            if not documents:
                error_msg = state.get("error", "No relevant legal documents found.")
                return {
                    **state,
                    "answer": "Based on the available Moroccan legal documents, I cannot find specific information about this topic. Please ensure relevant legal texts have been ingested into the system.",
                    "error": error_msg,
                }
            
            # Format context from retrieved documents
            context = self._format_context(documents)
            
            # Build the system prompt with Moroccan legal instructions
            system_prompt = MOROCCAN_LEGAL_SYSTEM_PROMPT.format(
                context=context,
                question=question,
            )
            
            logger.info(f"Generating answer with {len(documents)} context documents")
            
            # Call LLM API
            answer = self._call_llm(system_prompt, question)
            
            return {
                **state,
                "answer": answer,
            }
            
        except Exception as e:
            logger.error(f"Generate node error: {e}")
            return {
                **state,
                "answer": "An error occurred while generating the response. Please try again.",
                "error": str(e),
            }

    def _format_context(self, documents: List[Dict[str, Any]]) -> str:
        """Format retrieved documents into context string for LLM."""
        context_parts = []
        
        for i, doc in enumerate(documents, 1):
            content = doc.get("content", "")
            metadata = doc.get("metadata", {})
            article = metadata.get("article_number", "N/A")
            source = metadata.get("source", "Unknown Source")
            law_type = metadata.get("law_type", "")
            
            context_part = f"""
[Document {i}]
Source: {source}
Article: {article}
Law Type: {law_type}
Content: {content}
---
"""
            context_parts.append(context_part)
        
        return "\n".join(context_parts)

    def _call_llm(self, system_prompt: str, user_question: str) -> str:
        """
        Call LLM API for answer generation.
        Supports OpenAI-compatible APIs (Ollama, vLLM, OpenAI, etc.)
        """
        import httpx
        
        payload = {
            "model": self.llm_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_question},
            ],
            "stream": False,
            "temperature": 0.3,  # Lower temperature for factual legal responses
            "max_tokens": 1024,
        }
        
        headers = {
            "Content-Type": "application/json",
        }
        
        if self.llm_api_key:
            headers["Authorization"] = f"Bearer {self.llm_api_key}"
        
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                self.llm_api_url,
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            result = response.json()
            
            # Handle different API response formats
            if "choices" in result:  # OpenAI format
                return result["choices"][0]["message"]["content"]
            elif "message" in result:  # Ollama format
                return result["message"]["content"]
            else:
                return str(result)

    async def _call_llm_stream(
        self,
        system_prompt: str,
        user_question: str,
    ):
        """
        Call LLM API with streaming support.
        Yields chunks as they arrive from the LLM.
        """
        payload = {
            "model": self.llm_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_question},
            ],
            "stream": True,
            "temperature": 0.3,
            "max_tokens": 1024,
        }
        
        headers = {
            "Content-Type": "application/json",
        }
        
        if self.llm_api_key:
            headers["Authorization"] = f"Bearer {self.llm_api_key}"
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                self.llm_api_url,
                json=payload,
                headers=headers,
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]  # Remove "data: " prefix
                        if data.strip() == "[DONE]":
                            break
                        try:
                            import json
                            chunk = json.loads(data)
                            
                            # Extract content from different API formats
                            content = None
                            if "choices" in chunk:  # OpenAI SSE format
                                delta = chunk["choices"][0].get("delta", {})
                                content = delta.get("content")
                            elif "message" in chunk:  # Ollama format
                                content = chunk.get("message", {}).get("content")
                            
                            if content:
                                yield content
                                
                        except json.JSONDecodeError:
                            continue

    def invoke(self, question: str, tenant_id: str, n_results: int = 5) -> AgentState:
        """
        Invoke the RAG workflow synchronously.
        
        Args:
            question: User's legal question
            tenant_id: Tenant identifier for isolation
            n_results: Number of documents to retrieve
        
        Returns:
            AgentState with question, documents, answer, and sources
        """
        initial_state: AgentState = {
            "question": question,
            "tenant_id": tenant_id,
            "documents": [],
            "answer": "",
            "sources": [],
            "error": None,
        }
        
        result = self.graph.invoke(initial_state)
        return result

    async def invoke_stream(
        self,
        question: str,
        tenant_id: str,
        n_results: int = 5,
    ):
        """
        Invoke the RAG workflow with streaming response.
        
        Yields:
            - First: Retrieved documents
            - Then: Streaming answer chunks
            - Finally: Complete state
        """
        # First, run retrieval (non-streaming)
        initial_state: AgentState = {
            "question": question,
            "tenant_id": tenant_id,
            "documents": [],
            "answer": "",
            "sources": [],
            "error": None,
        }
        
        # Run retrieve node
        retrieve_result = self._retrieve_node(initial_state)
        
        # Yield documents for immediate display
        yield {
            "type": "documents",
            "documents": retrieve_result["documents"],
            "sources": retrieve_result["sources"],
        }
        
        # Then stream the generation
        documents = retrieve_result["documents"]
        
        if not documents:
            yield {
                "type": "answer_chunk",
                "content": "Based on the available Moroccan legal documents, I cannot find specific information about this topic.",
            }
            yield {"type": "end"}
            return
        
        # Format context and prompt
        context = self._format_context(documents)
        system_prompt = MOROCCAN_LEGAL_SYSTEM_PROMPT.format(
            context=context,
            question=question,
        )
        
        # Stream LLM response
        async for chunk in self._call_llm_stream(system_prompt, question):
            yield {
                "type": "answer_chunk",
                "content": chunk,
            }
        
        yield {"type": "end"}
