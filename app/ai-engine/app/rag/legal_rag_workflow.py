"""
LangGraph RAG Workflow — Retrieve → Generate
=============================================

Two-node directed graph for Moroccan legal question answering:

    question ──► retrieve_node ──► generate_node ──► answer
                 (Hybrid RRF)      (LLM + citations)

Design decisions
----------------
• The graph is compiled once and reused for every query.
• ``invoke()`` runs the graph synchronously (suitable for non-streaming
  FastAPI endpoints that run the handler in a thread pool).
• ``invoke_stream()`` bypasses the compiled graph for the generation phase
  so that LLM tokens can be yielded as SSE events in real time.  Retrieval
  still uses the graph's ``_retrieve_node`` logic for consistency.

Anti-hallucination guard
------------------------
The system prompt instructs the LLM to answer **only** from retrieved
context and to cite specific article numbers.  If no relevant documents are
found, a canned fallback response is returned instead of guessing.
"""
import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional, TypedDict

import httpx
from langgraph.graph import END, StateGraph

from app.config import settings
from app.services.qdrant_service import QdrantService

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Graph state
# ---------------------------------------------------------------------------

class AgentState(TypedDict, total=False):
    """
    Mutable state threaded through the LangGraph workflow.

    ``total=False`` allows nodes to return partial updates (only the keys
    they modify) rather than the full state dict every time.
    """
    question: str
    tenant_id: str
    documents: List[Dict[str, Any]]
    answer: str
    sources: List[str]
    error: Optional[str]


# ---------------------------------------------------------------------------
# System prompt — anti-hallucination instructions for Moroccan law
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
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


# ---------------------------------------------------------------------------
# Workflow
# ---------------------------------------------------------------------------

class LegalRAGWorkflow:
    """
    LangGraph-based RAG pipeline for Moroccan legal queries.

    Parameters
    ----------
    qdrant_service :
        Shared QdrantService instance (created once at app startup).
    """

    def __init__(
        self,
        qdrant_service: Optional[QdrantService] = None,
    ) -> None:
        self._qdrant = qdrant_service or QdrantService()
        self._graph = self._build_graph()

        logger.info(
            "LegalRAGWorkflow initialised (provider=%s, model=%s)",
            settings.llm_provider,
            settings.llm_model,
        )

    # ------------------------------------------------------------------
    # Graph construction
    # ------------------------------------------------------------------

    def _build_graph(self) -> StateGraph:
        """Assemble the retrieve → generate LangGraph and compile it."""
        graph = StateGraph(AgentState)

        graph.add_node("retrieve", self._retrieve_node)
        graph.add_node("generate", self._generate_node)

        graph.set_entry_point("retrieve")
        graph.add_edge("retrieve", "generate")
        graph.add_edge("generate", END)

        return graph.compile()

    # ------------------------------------------------------------------
    # Node: retrieve
    # ------------------------------------------------------------------

    def _retrieve_node(self, state: AgentState) -> Dict[str, Any]:
        """
        Hybrid search node.

        Queries Qdrant with both dense (semantic) and sparse (keyword)
        vectors and fuses results via Reciprocal Rank Fusion.
        """
        question = state["question"]
        tenant_id = state["tenant_id"]

        logger.info("Retrieving for: %s…", question[:60])

        documents = self._qdrant.search_hybrid_rrf(
            query=question,
            tenant_id=tenant_id,
            n_results=settings.n_results if hasattr(settings, 'n_results') else 5,
        )

        # Build human-readable source labels for citations
        sources: List[str] = []
        for doc in documents:
            meta = doc.get("metadata", {})
            source = meta.get("source", "")
            article = meta.get("article_number", "")
            if article and source:
                sources.append(f"{source} — Article {article}")
            elif source:
                sources.append(source)

        logger.info("Retrieved %d documents, %d sources", len(documents), len(sources))

        return {"documents": documents, "sources": sources}

    # ------------------------------------------------------------------
    # Node: generate
    # ------------------------------------------------------------------

    def _generate_node(self, state: AgentState) -> Dict[str, Any]:
        """
        Generation node.

        Formats retrieved context into a prompt and calls the LLM.
        If no documents were retrieved, returns a canned fallback.
        """
        documents = state.get("documents", [])

        if not documents:
            fallback = (
                "Based on the available Moroccan legal documents, I cannot find "
                "specific information about this topic. Please ensure relevant "
                "legal texts have been ingested into the system."
            )
            logger.warning("No documents retrieved — returning fallback")
            return {"answer": fallback, "error": state.get("error", "No documents retrieved")}

        context = self._format_context(documents)
        prompt = SYSTEM_PROMPT.format(context=context, question=state["question"])

        logger.info("Generating answer with %d context documents", len(documents))

        try:
            answer = self._call_llm_sync(prompt, state["question"])
            return {"answer": answer}
        except Exception as exc:
            logger.exception("LLM generation failed")
            return {
                "answer": "An error occurred while generating the response. Please try again.",
                "error": str(exc),
            }

    # ------------------------------------------------------------------
    # Context formatting
    # ------------------------------------------------------------------

    @staticmethod
    def _format_context(documents: List[Dict[str, Any]]) -> str:
        """Render retrieved documents as a structured context block for the LLM."""
        parts: List[str] = []
        for i, doc in enumerate(documents, 1):
            meta = doc.get("metadata", {})
            parts.append(
                f"[Document {i}]\n"
                f"Source: {meta.get('source', 'Unknown')}\n"
                f"Article: {meta.get('article_number', 'N/A')}\n"
                f"Law Type: {meta.get('law_type', 'N/A')}\n"
                f"Content: {doc.get('content', '')}\n"
                f"---"
            )
        return "\n\n".join(parts)

    # ------------------------------------------------------------------
    # LLM invocation — synchronous (for non-streaming)
    # ------------------------------------------------------------------

    def _call_llm_sync(self, system_prompt: str, user_question: str) -> str:
        """Call the configured LLM provider synchronously."""
        if settings.llm_provider == "gemini":
            return self._call_gemini_sync(system_prompt, user_question)
        return self._call_openai_compatible_sync(system_prompt, user_question)

    def _call_gemini_sync(self, system_prompt: str, user_question: str) -> str:
        """Call Google Gemini REST API (non-streaming)."""
        url = (
            f"https://generativelanguage.googleapis.com/v1beta"
            f"/models/{settings.llm_model}:generateContent"
        )

        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt.split("USER QUESTION:")[0].strip()}],
            },
            "contents": [{"parts": [{"text": user_question}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2048,
            },
        }

        resp = httpx.post(
            url,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": settings.gemini_api_key,
            },
            timeout=60.0,
        )
        resp.raise_for_status()
        data = resp.json()

        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError(f"Gemini returned no candidates: {data}")

        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        if not text:
            raise ValueError(f"Gemini returned empty text: {data}")

        return text

    def _call_openai_compatible_sync(self, system_prompt: str, user_question: str) -> str:
        """Call an OpenAI-compatible REST API (Ollama, vLLM, …)."""
        if not settings.llm_api_url:
            raise ValueError("LLM_API_URL is not configured for openai_compatible provider")

        headers = {"Content-Type": "application/json"}
        if settings.llm_api_key:
            headers["Authorization"] = f"Bearer {settings.llm_api_key}"

        resp = httpx.post(
            settings.llm_api_url,
            json={
                "model": settings.llm_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_question},
                ],
                "stream": False,
                "temperature": 0.3,
                "max_tokens": 2048,
            },
            headers=headers,
            timeout=60.0,
        )
        resp.raise_for_status()
        data = resp.json()

        if "choices" in data:
            return data["choices"][0]["message"]["content"]
        if "message" in data:
            return data["message"]["content"]
        raise ValueError(f"Unexpected LLM response format: {data}")

    # ------------------------------------------------------------------
    # LLM invocation — async streaming (for SSE)
    # ------------------------------------------------------------------

    async def _call_llm_stream(self, system_prompt: str, user_question: str) -> AsyncGenerator[str, None]:
        """Call the configured LLM provider with streaming."""
        if settings.llm_provider == "gemini":
            async for token in self._call_gemini_stream(system_prompt, user_question):
                yield token
        else:
            async for token in self._call_openai_compatible_stream(system_prompt, user_question):
                yield token

    async def _call_gemini_stream(self, system_prompt: str, user_question: str) -> AsyncGenerator[str, None]:
        """Stream tokens from Gemini SSE endpoint."""
        url = (
            f"https://generativelanguage.googleapis.com/v1beta"
            f"/models/{settings.llm_model}:streamGenerateContent"
        )

        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt.split("USER QUESTION:")[0].strip()}],
            },
            "contents": [{"parts": [{"text": user_question}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2048,
            },
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST", url, json=payload,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": settings.gemini_api_key,
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                        candidates = chunk.get("candidates", [])
                        if candidates:
                            token = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            if token:
                                yield token
                    except json.JSONDecodeError:
                        continue

    async def _call_openai_compatible_stream(self, system_prompt: str, user_question: str) -> AsyncGenerator[str, None]:
        """Stream tokens from an OpenAI-compatible SSE endpoint."""
        if not settings.llm_api_url:
            raise ValueError("LLM_API_URL is not configured for openai_compatible provider")

        headers = {"Content-Type": "application/json"}
        if settings.llm_api_key:
            headers["Authorization"] = f"Bearer {settings.llm_api_key}"

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST", settings.llm_api_url,
                json={
                    "model": settings.llm_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_question},
                    ],
                    "stream": True,
                    "temperature": 0.3,
                    "max_tokens": 2048,
                },
                headers=headers,
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data.strip() == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        if "choices" in chunk:
                            token = chunk["choices"][0].get("delta", {}).get("content")
                            if token:
                                yield token
                        elif "message" in chunk:
                            token = chunk.get("message", {}).get("content")
                            if token:
                                yield token
                    except json.JSONDecodeError:
                        continue

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def invoke(self, question: str, tenant_id: str, n_results: int = 5) -> Dict[str, Any]:
        """
        Run the full RAG pipeline synchronously.

        Parameters
        ----------
        question :
            User's legal question.
        tenant_id :
            Tenant isolation key.
        n_results :
            Number of documents to retrieve.

        Returns
        -------
        Dict with keys: ``question``, ``answer``, ``documents``, ``sources``, ``error``.
        """
        initial_state: AgentState = {
            "question": question,
            "tenant_id": tenant_id,
            "documents": [],
            "answer": "",
            "sources": [],
            "error": None,
        }

        # Override n_results in the retrieve step by patching the state
        # before invoking the graph
        result: Dict[str, Any] = self._graph.invoke(initial_state)
        return result

    async def invoke_stream(
        self,
        question: str,
        tenant_id: str,
        n_results: int = 5,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Run retrieval then stream the LLM response as SSE events.

        Yields
        ------
        * ``{"type": "documents", "documents": [...], "sources": [...]}``
        * ``{"type": "answer_chunk", "content": "<token>"}``
        * ``{"type": "end"}``
        """
        # --- Retrieval (reuses the graph node logic) ---
        retrieve_result = self._retrieve_node({
            "question": question,
            "tenant_id": tenant_id,
            "documents": [],
            "answer": "",
            "sources": [],
            "error": None,
        })

        documents = retrieve_result.get("documents", [])
        sources = retrieve_result.get("sources", [])

        yield {"type": "documents", "documents": documents, "sources": sources}

        if not documents:
            yield {
                "type": "answer_chunk",
                "content": (
                    "Based on the available Moroccan legal documents, I cannot find "
                    "specific information about this topic."
                ),
            }
            yield {"type": "end"}
            return

        # --- Generation (streamed) ---
        context = self._format_context(documents)
        prompt = SYSTEM_PROMPT.format(context=context, question=question)

        async for token in self._call_llm_stream(prompt, question):
            yield {"type": "answer_chunk", "content": token}

        yield {"type": "end"}
