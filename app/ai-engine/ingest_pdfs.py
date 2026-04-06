"""
PDF Ingestion Script — Extract and Index Legal Documents
=========================================================

Reads all PDFs from the data/raw/ directory, extracts text using PyPDF2,
and ingests them into the Qdrant vector database via the AI engine API.

Usage:
    python ingest_pdfs.py [--tenant-id YOUR_TENANT_ID] [--api-url API_URL]

Requirements:
    pip install PyPDF2 httpx
"""
import argparse
import logging
import os
import sys
from pathlib import Path

import httpx

# Try to import PyPDF2
try:
    import PyPDF2
except ImportError:
    print("PyPDF2 is required. Install it with: pip install PyPDF2")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# Paths
RAW_DIR = Path(__file__).parent / "data" / "raw"

# API configuration
DEFAULT_API_URL = "http://localhost:8000"
DEFAULT_TENANT_ID = "default"


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract text from a PDF file."""
    logger.info(f"Extracting text from: {pdf_path.name}")
    
    try:
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page_num, page in enumerate(reader.pages, 1):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
            
            logger.info(f"Extracted {len(text)} characters from {pdf_path.name}")
            return text.strip()
    except Exception as e:
        logger.error(f"Failed to extract text from {pdf_path.name}: {e}")
        return ""


def ingest_document(
    api_url: str,
    tenant_id: str,
    doc_id: str,
    text: str,
    metadata: dict,
) -> dict:
    """Send a document to the AI engine for ingestion."""
    endpoint = f"{api_url}/v1/documents"
    
    payload = {
        "doc_id": doc_id,
        "text": text,
        "metadata": metadata,
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenant_id,
    }
    
    try:
        response = httpx.post(endpoint, json=payload, headers=headers, timeout=120.0)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Failed to ingest {doc_id}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response: {e.response.text}")
        raise


def main():
    parser = argparse.ArgumentParser(description="Ingest PDF documents into Qdrant")
    parser.add_argument("--tenant-id", default=DEFAULT_TENANT_ID, help="Tenant ID (default: default)")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="AI Engine API URL (default: http://localhost:8000)")
    args = parser.parse_args()

    api_url: str = args.api_url
    tenant_id: str = args.tenant_id

    # Find all PDFs in data/raw/
    pdf_files = list(RAW_DIR.glob("*.pdf"))
    
    if not pdf_files:
        logger.warning(f"No PDF files found in {RAW_DIR}")
        sys.exit(0)
    
    logger.info(f"Found {len(pdf_files)} PDF file(s) to ingest")
    
    success_count = 0
    error_count = 0
    
    for pdf_path in pdf_files:
        # Extract text
        text = extract_text_from_pdf(pdf_path)
        
        if not text:
            logger.warning(f"Skipping {pdf_path.name} - no text extracted")
            error_count += 1
            continue
        
        # Create metadata
        doc_id = pdf_path.stem  # filename without extension
        metadata = {
            "source": pdf_path.name,
            "law_type": "Moroccan Law",
            "language": "fr" if "fr" in pdf_path.name else "ar" if "ar" in pdf_path.name else "en",
        }
        
        # Ingest
        try:
            result = ingest_document(api_url, tenant_id, doc_id, text, metadata)
            logger.info(f"✅ {pdf_path.name}: {result.get('total_chunks', '?')} chunks indexed")
            success_count += 1
        except Exception as e:
            logger.error(f"❌ {pdf_path.name}: {e}")
            error_count += 1
    
    logger.info(f"\nIngestion complete: {success_count} succeeded, {error_count} failed")


if __name__ == "__main__":
    main()
