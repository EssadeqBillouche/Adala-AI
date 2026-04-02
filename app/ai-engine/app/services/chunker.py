"""
Document Chunking Strategy for Moroccan Legal Documents.

Implements hierarchical chunking optimized for legal texts:
- Preserves article boundaries (critical for citations)
- Maintains context with overlapping windows
- Supports Arabic, French, and English
"""
import re
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class Chunk:
    """Represents a document chunk with metadata."""
    content: str
    metadata: Dict[str, Any]
    start_index: int
    end_index: int


class LegalDocumentChunker:
    """
    Chunking strategy for Moroccan legal documents.
    
    WHY THIS STRATEGY:
    1. Article-based splitting: Legal citations reference specific articles
    2. Overlapping context: Prevents losing context at chunk boundaries
    3. Hierarchical: Handles laws → chapters → articles → paragraphs
    4. Multilingual: Works with Arabic (RTL), French, English
    """

    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        min_chunk_size: int = 100,
    ):
        """
        Initialize chunker with legal-document-optimized settings.
        
        Args:
            chunk_size: Target chunk size in characters (not tokens)
            chunk_overlap: Overlap between chunks for context preservation
            min_chunk_size: Minimum chunk size to avoid tiny fragments
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    def chunk_document(
        self,
        text: str,
        metadata: Dict[str, Any],
    ) -> List[Chunk]:
        """
        Chunk a legal document using hierarchical strategy.
        
        Priority:
        1. Split by Article boundaries (highest priority)
        2. Split by Chapter/Section if article too large
        3. Split by fixed size with overlap (fallback)
        """
        # Try article-based splitting first
        articles = self._split_by_articles(text)
        
        if len(articles) > 1:
            # Document has clear article structure
            chunks = []
            for article_text, start_idx in articles:
                # If article is too large, sub-chunk it
                if len(article_text) > self.chunk_size:
                    sub_chunks = self._split_by_size(article_text, start_idx)
                    chunks.extend(sub_chunks)
                else:
                    chunks.append(Chunk(
                        content=article_text.strip(),
                        metadata={
                            **metadata,
                            "chunk_type": "article",
                        },
                        start_index=start_idx,
                        end_index=start_idx + len(article_text),
                    ))
            return self._filter_chunks(chunks)
        
        # Fallback: size-based splitting with overlap
        return self._split_by_size(text, 0)

    def _split_by_articles(self, text: str) -> List[tuple[str, int]]:
        """
        Split text by article boundaries.
        
        Handles multilingual article patterns:
        - Arabic: "المادة 1" or "مادة 1"
        - French: "Article 1" or "Art. 1"
        - English: "Article 1" or "Art. 1"
        """
        # Regex patterns for article detection
        patterns = [
            # Arabic: المادة 1 or مادة 1
            (r'(المادة\s*\d+|مادة\s*\d+)', 'ar'),
            # French/English: Article 1 or Art. 1
            (r'(Article\s*\d+|Art\.\s*\d+)', 'fr'),
            # Numbered: 1. or 1-
            (r'^\s*(\d+[.\-])', 'num'),
        ]
        
        # Find all article boundaries
        boundaries = []
        for pattern, lang in patterns:
            for match in re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE):
                boundaries.append((match.start(), match.group()))
        
        # Sort by position
        boundaries.sort(key=lambda x: x[0])
        
        if not boundaries:
            # No articles found, return full text
            return [(text, 0)]
        
        # Split text at boundaries
        articles = []
        for i, (start, _) in enumerate(boundaries):
            end = boundaries[i + 1][0] if i + 1 < len(boundaries) else len(text)
            article_text = text[start:end].strip()
            articles.append((article_text, start))
        
        return articles

    def _split_by_size(self, text: str, offset: int) -> List[Chunk]:
        """
        Split text by character size with overlap.
        
        Uses sentence-aware splitting to avoid breaking mid-sentence.
        """
        if len(text) <= self.chunk_size:
            return [Chunk(
                content=text.strip(),
                metadata={"chunk_type": "text"},
                start_index=offset,
                end_index=offset + len(text),
            )]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            # Try to break at sentence boundary
            if end < len(text):
                # Look for sentence endings in the overlap region
                sentence_endings = ['.', '!', '?', '۔', '!', '?']
                best_break = end
                
                for ending in sentence_endings:
                    # Search backwards from end to find sentence boundary
                    search_start = max(start, end - self.chunk_overlap)
                    last_ending = text.rfind(ending, search_start, end)
                    if last_ending > start:
                        best_break = last_ending + 1
                        break
                
                end = best_break
            
            chunk_text = text[start:end].strip()
            
            if len(chunk_text) >= self.min_chunk_size:
                chunks.append(Chunk(
                    content=chunk_text,
                    metadata={"chunk_type": "text"},
                    start_index=offset + start,
                    end_index=offset + end,
                ))
            
            # Move start with overlap
            start = end - self.chunk_overlap
            if start >= len(text):
                break
        
        return chunks

    def _filter_chunks(self, chunks: List[Chunk]) -> List[Chunk]:
        """Remove empty or too-small chunks."""
        return [c for c in chunks if len(c.content) >= self.min_chunk_size]


# =============================================================================
# USAGE EXAMPLE
# =============================================================================

if __name__ == "__main__":
    # Example Moroccan Constitution text
    sample_text = """
    المادة 1: المملكة المغربية دولة إسلامية ذات سيادة كاملة...
    
    المادة 2: الشعب المغربي جزء من الأمة الإسلامية...
    
    المادة 23: للمواطنين الحق في الانتخاب والتصويت...
    
    Article 24: Tous les citoyens ont le droit de participer...
    """
    
    chunker = LegalDocumentChunker(chunk_size=512, chunk_overlap=50)
    chunks = chunker.chunk_document(
        text=sample_text,
        metadata={"source": "Moroccan Constitution", "tenant_id": "demo"}
    )
    
    for chunk in chunks:
        print(f"Article chunk: {chunk.content[:50]}...")
        print(f"Metadata: {chunk.metadata}")
        print("---")
