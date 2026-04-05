"""
Legal Document Chunker — Article-Aware Text Splitting
=====================================================

Splits Moroccan legal documents into semantically coherent chunks for
vector embedding.  The key insight is that **legal citations reference
specific articles** (e.g. "Article 23 of the Code Pénal"), so chunk
boundaries must align with article boundaries — not arbitrary character
counts.

Strategy (in priority order)
----------------------------
1. **Article-based split** — detect ``المادة X`` / ``Article X`` patterns
   and split at each boundary.
2. **Sub-chunking** — if a single article exceeds ``chunk_size``, fall back
   to size-based splitting with overlap.
3. **Fixed-size split** — when no article structure is detected, split by
   character count with sentence-boundary awareness.

Multilingual support
--------------------
Article patterns are detected in Arabic (RTL), French, and English.
Sentence-ending punctuation includes Arabic (``۔``) and Latin (``. ! ?``).
"""
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple


@dataclass(frozen=True)
class Chunk:
    """
    An immutable text chunk with positional metadata.

    Attributes
    ----------
    content :
        The raw chunk text.
    metadata :
        Arbitrary key-value pairs inherited from the parent document
        (e.g. ``source``, ``law_type``) plus ``chunk_type``.
    start_index :
        Character offset of this chunk within the original document.
    end_index :
        Character offset of the first character *after* this chunk.
    """
    content: str
    metadata: Dict[str, Any]
    start_index: int
    end_index: int


# ---------------------------------------------------------------------------
# Article boundary patterns
# ---------------------------------------------------------------------------

_ARTICLE_PATTERNS: List[Tuple[str, str]] = [
    # Arabic:  المادة 1  or  مادة 1
    (r"(?:المادة\s*\d+|مادة\s*\d+)", "ar"),
    # French / English:  Article 1  or  Art. 1
    (r"(?:Article\s*\d+|Art\.\s*\d+)", "fr"),
]

# Sentence-ending punctuation (Arabic + Latin)
_SENTENCE_ENDINGS = (".", "!", "?", "۔")


class LegalDocumentChunker:
    """
    Hierarchical chunker optimised for Moroccan legal texts.

    Parameters
    ----------
    chunk_size :
        Target maximum chunk length in **characters** (not tokens).
        Legal articles are typically 100–400 chars, so 512 is a safe default.
    chunk_overlap :
        Number of overlapping characters between adjacent size-based chunks
        to preserve context at boundaries.
    min_chunk_size :
        Chunks shorter than this are discarded to avoid embedding noise.
    """

    __slots__ = ("chunk_size", "chunk_overlap", "min_chunk_size")

    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        min_chunk_size: int = 100,
    ) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def chunk_document(
        self,
        text: str,
        metadata: Dict[str, Any],
    ) -> List[Chunk]:
        """
        Split a legal document into article-aligned chunks.

        Parameters
        ----------
        text :
            Full document text.
        metadata :
            Document-level metadata propagated to every chunk.

        Returns
        -------
        Ordered list of ``Chunk`` objects.
        """
        articles = self._split_by_articles(text)

        # Document has clear article structure
        if len(articles) > 1:
            chunks: List[Chunk] = []
            for article_text, start_idx in articles:
                if len(article_text) > self.chunk_size:
                    # Article too large → sub-chunk with overlap
                    chunks.extend(self._split_by_size(article_text, start_idx))
                else:
                    chunks.append(Chunk(
                        content=article_text.strip(),
                        metadata={**metadata, "chunk_type": "article"},
                        start_index=start_idx,
                        end_index=start_idx + len(article_text),
                    ))
            return self._filter_chunks(chunks)

        # No article structure → fall back to size-based splitting
        return self._split_by_size(text, offset=0)

    # ------------------------------------------------------------------
    # Article-based splitting
    # ------------------------------------------------------------------

    def _split_by_articles(self, text: str) -> List[Tuple[str, int]]:
        """
        Find all article boundaries and split the text accordingly.

        Returns a list of ``(article_text, start_offset)`` tuples.
        If no articles are found, returns the full text as a single segment.
        """
        boundaries: List[Tuple[int, str]] = []

        for pattern, _lang in _ARTICLE_PATTERNS:
            for match in re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE):
                boundaries.append((match.start(), match.group()))

        if not boundaries:
            return [(text, 0)]

        # Deduplicate overlapping matches (same start position)
        boundaries.sort(key=lambda x: x[0])
        deduped: List[Tuple[int, str]] = []
        last_start = -1
        for start, group in boundaries:
            if start != last_start:
                deduped.append((start, group))
                last_start = start

        # Build article segments
        articles: List[Tuple[str, int]] = []
        for i, (start, _) in enumerate(deduped):
            end = deduped[i + 1][0] if i + 1 < len(deduped) else len(text)
            articles.append((text[start:end].strip(), start))

        return articles

    # ------------------------------------------------------------------
    # Size-based splitting with sentence-boundary awareness
    # ------------------------------------------------------------------

    def _split_by_size(self, text: str, offset: int) -> List[Chunk]:
        """
        Split text into fixed-size chunks with overlap.

        Attempts to break at sentence boundaries (``. ! ? ۔``) within the
        overlap region to avoid cutting mid-sentence.
        """
        if len(text) <= self.chunk_size:
            return [Chunk(
                content=text.strip(),
                metadata={"chunk_type": "text"},
                start_index=offset,
                end_index=offset + len(text),
            )]

        chunks: List[Chunk] = []
        start = 0

        while start < len(text):
            end = min(start + self.chunk_size, len(text))

            # Try to find a sentence boundary in the overlap zone
            if end < len(text):
                search_start = max(start, end - self.chunk_overlap)
                for ending in _SENTENCE_ENDINGS:
                    pos = text.rfind(ending, search_start, end)
                    if pos > start:
                        end = pos + 1
                        break

            chunk_text = text[start:end].strip()

            if len(chunk_text) >= self.min_chunk_size:
                chunks.append(Chunk(
                    content=chunk_text,
                    metadata={"chunk_type": "text"},
                    start_index=offset + start,
                    end_index=offset + end,
                ))

            # Advance with overlap
            start = end - self.chunk_overlap
            if start >= len(text):
                break

        return chunks

    # ------------------------------------------------------------------
    # Filtering
    # ------------------------------------------------------------------

    @staticmethod
    def _filter_chunks(chunks: List[Chunk]) -> List[Chunk]:
        """Remove empty or undersized chunks."""
        return [c for c in chunks if len(c.content) >= 100]  # hard-coded floor
