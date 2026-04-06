"""
PDF Ingestion Pipeline — Docling → HybridChunker → Qdrant
===========================================================

Modern replacement for the old PyPDF2-based ``ingest_pdfs.py``.

Pipeline
--------
1. Read PDFs from ``data/raw/``
2. Convert to Markdown via **Docling** (preserves tables & reading order)
3. Embed & index directly into **Qdrant** (hybrid: dense BGE-M3 + sparse SPLADE)
   — chunks are produced by Docling's ``HybridChunker`` and pushed to Qdrant
     via the in-process ``QdrantService`` (no HTTP round-trip needed).

Usage:
    # Default: ingest all PDFs in data/raw/
    python ingest_pdfs.py

    # Single file
    python ingest_pdfs.py --file data/raw/code_commerce_fr.pdf

    # Custom tenant
    python ingest_pdfs.py --tenant-id lawfirm_xyz

    # Enable OCR for scanned PDFs
    python ingest_pdfs.py --enable-ocr

Requirements:
    pip install "docling>=2.0" tqdm
    # For OCR:
    pip install "docling[easyocr]"
"""
import argparse
import logging
import sys
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from tqdm import tqdm

# ---------------------------------------------------------------------------
# Docling imports
# ---------------------------------------------------------------------------
try:
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import EasyOcrOptions, PdfPipelineOptions
    from docling.document_converter import DocumentConverter
    from docling.chunking import HybridChunker
except ImportError:
    print(
        "Docling is required but not installed.\n"
        "Install it with:\n"
        '  pip install "docling>=2.0" tqdm\n'
        "For OCR support also run:\n"
        '  pip install "docling[easyocr]"'
    )
    sys.exit(1)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths — relative to this script's location (ai-engine/)
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
RAW_DIR = SCRIPT_DIR / "data" / "raw"

# ---------------------------------------------------------------------------
# QdrantService — lazy import from the app package
# ---------------------------------------------------------------------------
from app.services.qdrant_service import QdrantService
from app.config import settings

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------
@dataclass
class IngestResult:
    """Outcome of processing a single PDF."""

    filename: str
    status: str  # "success" | "skipped" | "error"
    chunks_indexed: int = 0
    markdown_path: Optional[str] = None
    error_message: Optional[str] = None


@dataclass
class IngestStats:
    """Aggregate stats for the batch."""

    total: int = 0
    success: int = 0
    skipped: int = 0
    errors: int = 0
    total_chunks: int = 0
    results: List[IngestResult] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Core pipeline
# ---------------------------------------------------------------------------
class PDFIngestionPipeline:
    """Docling → HybridChunker → Qdrant ingestion pipeline."""

    def __init__(
        self,
        qdrant_service: QdrantService,
        enable_ocr: bool = False,
        max_tokens: int = 512,
    ):
        self._qdrant = qdrant_service
        self._converter = self._build_converter(enable_ocr=enable_ocr)
        self._chunker = HybridChunker(
            tokenizer="sentence-transformers/all-MiniLM-L6-v2",
            max_tokens=max_tokens,
            merge_peers=True,
        )

    def _build_converter(self, enable_ocr: bool) -> DocumentConverter:
        """Create a DocumentConverter tuned for legal PDFs."""
        pipeline_options = PdfPipelineOptions()

        if enable_ocr:
            pipeline_options.ocr_options = EasyOcrOptions()
            logger.info("OCR enabled (easyocr) for scanned PDFs")

        return DocumentConverter(
            allowed_formats=[InputFormat.PDF],
            pipeline_options=pipeline_options,
        )

    def ingest_pdf(
        self,
        pdf_path: Path,
        tenant_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> IngestResult:
        """Convert, chunk, embed, and index a single PDF.

        Parameters
        ----------
        pdf_path :
            Path to the PDF file.
        tenant_id :
            Multi-tenant isolation key for Qdrant.
        metadata :
            Extra key-value pairs (source, law_type, language, …).

        Returns
        -------
        IngestResult
        """
        doc_id = pdf_path.stem
        meta = metadata or {}

        try:
            # 1. Convert PDF → Docling document
            logger.info("Converting: %s", pdf_path.name)
            conv_result = self._converter.convert(str(pdf_path))
            doc = conv_result.document

            # Export to Markdown (for optional disk export)
            markdown_text = doc.export_to_markdown()

            if not markdown_text or not markdown_text.strip():
                return IngestResult(
                    filename=pdf_path.name,
                    status="skipped",
                    error_message="No text extracted (scanned PDF without OCR?)",
                )

            # 2. Chunk with HybridChunker
            chunks = list(self._chunker.chunk(doc))

            if not chunks:
                return IngestResult(
                    filename=pdf_path.name,
                    status="skipped",
                    error_message="HybridChunker produced zero chunks",
                )

            logger.info("%s → %d chunk(s)", pdf_path.name, len(chunks))

            # 3. Build payload matching QdrantService's expected format
            chunk_texts = [ch.text for ch in chunks]
            points = []
            indexed_ids = []

            for i, ch in enumerate(chunks):
                chunk_id = str(
                    uuid.uuid5(uuid.NAMESPACE_DNS, f"{doc_id}_chunk_{i}")
                )

                payload = {
                    **meta,
                    "parent_doc_id": doc_id,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "tenant_id": tenant_id,
                    "content": ch.text,
                    "token_count": ch.meta.token_count if hasattr(ch.meta, "token_count") else 0,
                }

                points.append({
                    "id": chunk_id,
                    "text": ch.text,
                    "payload": payload,
                })
                indexed_ids.append(chunk_id)

            # 4. Batch embed & upsert into Qdrant
            collection = self._qdrant.collection_name

            # Encode dense + sparse vectors in batch
            dense_vectors = self._qdrant._encode_dense(chunk_texts)
            sparse_vectors = self._qdrant._encode_sparse(chunk_texts)

            # Build PointStruct list
            from qdrant_client.models import PointStruct
            qdrant_points = []
            for i, pt in enumerate(points):
                qdrant_points.append(PointStruct(
                    id=pt["id"],
                    vector={
                        "dense": dense_vectors[i],
                        "sparse": sparse_vectors[i],
                    },
                    payload=pt["payload"],
                ))

            # Upsert
            self._qdrant._client.upsert(
                collection_name=collection,
                points=qdrant_points,
            )

            logger.info(
                "✅ %s — %d chunks indexed in Qdrant",
                pdf_path.name,
                len(indexed_ids),
            )

            return IngestResult(
                filename=pdf_path.name,
                status="success",
                chunks_indexed=len(indexed_ids),
            )

        except Exception as e:
            logger.error("❌ %s — %s", pdf_path.name, e, exc_info=True)
            return IngestResult(
                filename=pdf_path.name,
                status="error",
                error_message=str(e),
            )


# ---------------------------------------------------------------------------
# Batch processor
# ---------------------------------------------------------------------------
def run_pipeline(
    input_dir: Path,
    tenant_id: str,
    enable_ocr: bool = False,
    file_path: Optional[Path] = None,
    max_tokens: int = 512,
) -> IngestStats:
    """Run the ingestion pipeline on a directory or single file.

    Parameters
    ----------
    input_dir :
        Base directory for PDFs (used when ``file_path`` is None).
    tenant_id :
        Qdrant tenant identifier.
    enable_ocr :
        Enable OCR for scanned documents.
    file_path :
        If set, process only this single file (ignores ``input_dir``).
    max_tokens :
        HybridChunker max tokens per chunk.

    Returns
    -------
    IngestStats
    """
    # Resolve file list
    if file_path:
        if not file_path.exists():
            logger.error("File not found: %s", file_path)
            sys.exit(1)
        pdf_files = [file_path]
    else:
        pdf_files = sorted(input_dir.glob("*.pdf"))

    stats = IngestStats(total=len(pdf_files))

    if not pdf_files:
        logger.warning("No PDF files found in %s", input_dir)
        return stats

    logger.info("Found %d PDF(s) to ingest", len(pdf_files))

    # Initialise QdrantService (loads embedding models, connects to Qdrant)
    qdrant_service = QdrantService()

    # Initialise pipeline
    pipeline = PDFIngestionPipeline(
        qdrant_service=qdrant_service,
        enable_ocr=enable_ocr,
        max_tokens=max_tokens,
    )

    # Process each file
    for pdf_path in tqdm(pdf_files, desc="Ingesting PDFs", unit="file"):
        metadata = {
            "source": pdf_path.name,
            "law_type": "Moroccan Law",
            "language": "fr" if "fr" in pdf_path.name else "ar" if "ar" in pdf_path.name else "en",
        }

        result = pipeline.ingest_pdf(
            pdf_path=pdf_path,
            tenant_id=tenant_id,
            metadata=metadata,
        )

        if result.status == "success":
            stats.success += 1
            stats.total_chunks += result.chunks_indexed
        elif result.status == "skipped":
            stats.skipped += 1
        else:
            stats.errors += 1

        stats.results.append(result)

    return stats


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Ingest PDF documents into Qdrant (Docling → HybridChunker → Qdrant).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--file",
        type=Path,
        default=None,
        help="Process a single PDF file (overrides --input-dir)",
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=RAW_DIR,
        help=f"Directory containing PDF files (default: {RAW_DIR})",
    )
    parser.add_argument(
        "--tenant-id",
        default="default",
        help="Tenant ID for Qdrant isolation (default: default)",
    )
    parser.add_argument(
        "--enable-ocr",
        action="store_true",
        help="Enable OCR for scanned PDFs (requires docling[easyocr])",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=512,
        help="Max tokens per chunk for HybridChunker (default: 512)",
    )
    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("PDF Ingestion Pipeline — Docling → Qdrant")
    logger.info("=" * 60)
    if args.file:
        logger.info("File:   %s", args.file)
    else:
        logger.info("Input:  %s", args.input_dir)
    logger.info("Tenant: %s", args.tenant_id)
    logger.info("OCR:    %s", "enabled" if args.enable_ocr else "disabled")
    logger.info("Tokens: %d per chunk", args.max_tokens)
    logger.info("=" * 60)

    # Run
    stats = run_pipeline(
        input_dir=args.input_dir,
        tenant_id=args.tenant_id,
        enable_ocr=args.enable_ocr,
        file_path=args.file,
        max_tokens=args.max_tokens,
    )

    # Summary
    logger.info("")
    logger.info("=" * 60)
    logger.info("SUMMARY")
    logger.info("=" * 60)
    logger.info("Total files:     %d", stats.total)
    logger.info("Success:         %d ✅", stats.success)
    logger.info("Skipped:         %d ⚠️", stats.skipped)
    logger.info("Errors:          %d ❌", stats.errors)
    logger.info("Total chunks:    %d", stats.total_chunks)
    logger.info("=" * 60)

    if stats.errors > 0:
        logger.info("\nFailed files:")
        for r in stats.results:
            if r.status == "error":
                logger.info("  - %s: %s", r.filename, r.error_message)

    sys.exit(1 if stats.errors > 0 else 0)


if __name__ == "__main__":
    main()
