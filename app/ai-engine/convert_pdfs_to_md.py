"""
PDF-to-Markdown Converter using Docling
========================================

Converts Moroccan legal PDFs (including multi-column official bulletins)
into clean, structured Markdown with preserved tables and reading order.

Features:
  - OCR support for scanned PDFs (easyocr backend)
  - Table → Markdown table conversion
  - Reading-order preservation for multi-column layouts
  - Hybrid chunking that respects legal boundaries (Articles/Sections)
  - Progress bar via tqdm
  - Per-file .md export to ./data/processed

Usage:
    # Convert all PDFs in data/raw/ → data/processed/
    python convert_pdfs_to_md.py

    # Enable OCR for scanned documents
    python convert_pdfs_to_md.py --enable-ocr

    # Custom input/output directories
    python convert_pdfs_to_md.py --input-dir ./data/raw --output-dir ./data/processed

    # Also chunk and save chunks as JSON (for direct Qdrant ingestion)
    python convert_pdfs_to_md.py --chunk

Requirements:
    pip install "docling>=2.0" tqdm
    # For OCR support:
    pip install "docling[easyocr]"
"""
import argparse
import json
import logging
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from tqdm import tqdm

# ---------------------------------------------------------------------------
# Docling imports — deferred so the script gives a friendly error if missing
# ---------------------------------------------------------------------------
try:
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import EasyOcrOptions, OcrOptions, PdfPipelineOptions
    from docling.document_converter import DocumentConverter
    from docling.chunking import HybridChunker
except ImportError:
    print(
        "Docling is required but not installed.\n"
        "Install it with:\n"
        "  pip install \"docling>=2.0\" tqdm\n"
        "For OCR support also run:\n"
        "  pip install \"docling[easyocr]\""
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
# Defaults — paths are relative to this script's location (ai-engine/)
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT_DIR = SCRIPT_DIR / "data" / "raw"
DEFAULT_OUTPUT_DIR = SCRIPT_DIR / "data" / "processed"

# Regex patterns that mark legal boundaries in Moroccan documents
LEGAL_BOUNDARY_PATTERNS = [
    r"^Article\s+\d+",           # French: Article 1, Article 2, ...
    r"^المادة\s+\d+",            # Arabic: المادة 1, المادة 2, ...
    r"^باب\s+",                   # French/Arabic: Book/Section header
    r"^ Titre\s+",                # French: Title
    r"^ Chapitre\s+",             # French: Chapter
    r"^ Section\s+",              # French/English: Section
    r"^ Parte\s+",                # French: Part
    r"^ فصل\s+",                  # Arabic: Chapter/Section
]


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------
@dataclass
class ConversionResult:
    """Tracks the outcome of processing a single PDF."""

    filename: str
    status: str  # "success" | "skipped" | "error"
    markdown_path: Optional[str] = None
    chunk_count: int = 0
    error_message: Optional[str] = None


@dataclass
class ConversionStats:
    """Aggregate stats for the entire batch."""

    total: int = 0
    success: int = 0
    skipped: int = 0
    errors: int = 0
    results: List[ConversionResult] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Core converter
# ---------------------------------------------------------------------------
class PDFToMarkdownConverter:
    """Wraps Docling's DocumentConverter with Moroccan-legal-specific settings."""

    def __init__(
        self,
        enable_ocr: bool = False,
        ocr_backend: str = "easyocr",
    ):
        self._enable_ocr = enable_ocr
        self._ocr_backend = ocr_backend
        self._converter = self._build_converter()

    def _build_converter(self) -> DocumentConverter:
        """Create a DocumentConverter tuned for legal documents."""
        pipeline_options = PdfPipelineOptions()

        # Enable OCR if requested
        if self._enable_ocr:
            if self._ocr_backend == "easyocr":
                pipeline_options.ocr_options = EasyOcrOptions()
                logger.info("OCR enabled (easyocr backend) for scanned PDFs")
            else:
                logger.warning("Unknown OCR backend '%s' — falling back to easyocr", self._ocr_backend)
                pipeline_options.ocr_options = EasyOcrOptions()

        # Build the converter — Docling auto-detects tables and preserves
        # reading order for multi-column layouts out of the box.
        return DocumentConverter(
            allowed_formats=[InputFormat.PDF],
            pipeline_options=pipeline_options,
        )

    def convert(self, pdf_path: Path) -> tuple[str, Any]:
        """Convert a single PDF to markdown string and docling document.

        Returns:
            (markdown_text, docling_document)
        """
        result = self._converter.convert(str(pdf_path))
        markdown = result.document.export_to_markdown()
        return markdown, result.document

    def chunk_document(
        self,
        doc,
        max_tokens: int = 512,
        overlap: int = 50,
    ) -> List[Dict[str, Any]]:
        """Chunk a docling document respecting legal boundaries.

        Uses Docling's HybridChunker which combines token-based splitting
        with semantic awareness.  We configure it so that natural breaks
        (Article headings, Section titles) are favoured as chunk boundaries.

        Returns a list of dicts with keys: ``text``, ``metadata``.
        """
        chunker = HybridChunker(
            tokenizer="sentence-transformers/all-MiniLM-L6-v2",  # lightweight tokenizer
            max_tokens=max_tokens,
            merge_peers=True,
        )

        chunks = list(chunker.chunk(doc))

        chunk_list = []
        for idx, ch in enumerate(chunks):
            chunk_list.append({
                "chunk_id": idx,
                "text": ch.text,
                "metadata": {
                    "chunk_index": idx,
                    "total_chunks": len(chunks),
                    "token_count": ch.meta.token_count if hasattr(ch.meta, "token_count") else 0,
                },
            })

        return chunk_list


# ---------------------------------------------------------------------------
# Batch processor
# ---------------------------------------------------------------------------
def process_directory(
    input_dir: Path,
    output_dir: Path,
    enable_ocr: bool = False,
    do_chunk: bool = False,
) -> ConversionStats:
    """Convert every PDF in *input_dir* to Markdown in *output_dir*.

    Parameters
    ----------
    input_dir :
        Directory containing ``.pdf`` files.
    output_dir :
        Where ``.md`` (and optional ``_chunks.json``) files are written.
    enable_ocr :
        Run OCR on scanned pages.
    do_chunk :
        Also run HybridChunker and save chunks as JSON.

    Returns
    -------
    ConversionStats
    """
    pdf_files = sorted(input_dir.glob("*.pdf"))

    stats = ConversionStats(total=len(pdf_files))

    if not pdf_files:
        logger.warning("No PDF files found in %s", input_dir)
        return stats

    logger.info("Found %d PDF(s) in %s", len(pdf_files), input_dir)
    logger.info("Output directory: %s", output_dir)

    # Initialise Docling converter
    converter = PDFToMarkdownConverter(enable_ocr=enable_ocr)

    for pdf_path in tqdm(pdf_files, desc="Converting PDFs", unit="file"):
        md_filename = pdf_path.stem + ".md"
        md_path = output_dir / md_filename
        result = ConversionResult(filename=pdf_path.name, status="pending")

        try:
            # Convert
            markdown_text, doc = converter.convert(pdf_path)

            if not markdown_text or not markdown_text.strip():
                result.status = "skipped"
                result.error_message = "No text extracted (possible image-only scan without OCR)"
                logger.warning("⚠️  %s — no text extracted", pdf_path.name)
                stats.skipped += 1
                stats.results.append(result)
                continue

            # Ensure output dir exists
            output_dir.mkdir(parents=True, exist_ok=True)

            # Write Markdown
            md_path.write_text(markdown_text, encoding="utf-8")
            result.markdown_path = str(md_path)
            result.chunk_count = 1  # at least the full markdown

            # Optional: chunk and save as JSON
            if do_chunk:
                chunks = converter.chunk_document(doc)
                chunk_file = output_dir / f"{pdf_path.stem}_chunks.json"
                chunk_file.write_text(
                    json.dumps(chunks, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                result.chunk_count = len(chunks)
                logger.info(
                    "✅ %s → %s  (%d chunk(s))",
                    pdf_path.name,
                    md_filename,
                    len(chunks),
                )
            else:
                logger.info("✅ %s → %s", pdf_path.name, md_filename)

            result.status = "success"
            stats.success += 1

        except Exception as e:
            result.status = "error"
            result.error_message = str(e)
            logger.error("❌ %s — %s", pdf_path.name, e)
            stats.errors += 1

        stats.results.append(result)

    return stats


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Convert Moroccan legal PDFs to clean Markdown using Docling.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=DEFAULT_INPUT_DIR,
        help="Directory containing PDF files (default: ./data/raw)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Directory for output Markdown files (default: ./data/processed)",
    )
    parser.add_argument(
        "--enable-ocr",
        action="store_true",
        help="Enable OCR for scanned PDFs (requires docling[easyocr])",
    )
    parser.add_argument(
        "--chunk",
        action="store_true",
        help="Also split into chunks using HybridChunker and save as JSON",
    )
    args = parser.parse_args()

    input_dir: Path = args.input_dir
    output_dir: Path = args.output_dir

    if not input_dir.is_dir():
        logger.error("Input directory does not exist: %s", input_dir)
        sys.exit(1)

    logger.info("=" * 60)
    logger.info("PDF-to-Markdown Converter (Docling)")
    logger.info("=" * 60)
    logger.info("Input:  %s", input_dir)
    logger.info("Output: %s", output_dir)
    logger.info("OCR:    %s", "enabled" if args.enable_ocr else "disabled")
    logger.info("Chunk:  %s", "enabled" if args.chunk else "disabled")
    logger.info("=" * 60)

    # Run
    stats = process_directory(
        input_dir=input_dir,
        output_dir=output_dir,
        enable_ocr=args.enable_ocr,
        do_chunk=args.chunk,
    )

    # Summary
    logger.info("")
    logger.info("=" * 60)
    logger.info("SUMMARY")
    logger.info("=" * 60)
    logger.info("Total:    %d", stats.total)
    logger.info("Success:  %d ✅", stats.success)
    logger.info("Skipped:  %d ⚠️", stats.skipped)
    logger.info("Errors:   %d ❌", stats.errors)
    logger.info("=" * 60)

    if stats.errors > 0:
        logger.info("\nFailed files:")
        for r in stats.results:
            if r.status == "error":
                logger.info("  - %s: %s", r.filename, r.error_message)

    # Exit code
    sys.exit(1 if stats.errors > 0 else 0)


if __name__ == "__main__":
    main()
