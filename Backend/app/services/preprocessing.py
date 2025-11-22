"""
Document Preprocessing Service (Python 3.13 Safe)
Uses PyPDF2, python-docx, and TXT extraction.
"""

import re
import logging
from pathlib import Path
import PyPDF2
import docx
from app.exceptions import FileUploadError

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def clean_text(text: str) -> str:
    # Replace multiple whitespace with a single space
    text = re.sub(r"\s+", " ", text)
    return text.strip()


class DocumentPreprocessor:
    @staticmethod
    def extract_pdf(file_path: str) -> str:
        """Extract text from a PDF using PyPDF2 (compatible with Python 3.13)."""
        try:
            text = []
            with open(file_path, "rb") as file:
                reader = PyPDF2.PdfReader(file)
                logger.info(f"PDF has {len(reader.pages)} pages (if available).")
                for p_idx, page in enumerate(reader.pages):
                    extracted = page.extract_text() or ""
                    # append and add a newline between pages
                    text.append(extracted)
                    # optional small log for large PDFs (every 50 pages)
                    if (p_idx + 1) % 50 == 0:
                        logger.info(f"Extracted {p_idx+1} pages so far...")
            joined = " ".join(text).strip()
            logger.info(f"Extracted {len(joined)} characters from PDF")
            return joined
        except Exception as e:
            logger.exception("PDF extraction failed")
            raise FileUploadError(f"PDF extraction failed: {str(e)}")

    @staticmethod
    def extract_docx(file_path: str) -> str:
        """Extract text from a DOCX file."""
        try:
            document = docx.Document(file_path)
            paragraphs = [p.text for p in document.paragraphs]
            joined = "\n".join(paragraphs).strip()
            logger.info(f"Extracted {len(joined)} characters from DOCX")
            return joined
        except Exception as e:
            logger.exception("DOCX extraction failed")
            raise FileUploadError(f"DOCX extraction failed: {str(e)}")

    @staticmethod
    def extract_txt(file_path: str) -> str:
        """Extract text from a TXT or MD file."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            logger.info(f"Extracted {len(content)} characters from TXT/MD")
            return content.strip()
        except Exception as e:
            logger.exception("TXT extraction failed")
            raise FileUploadError(f"TXT extraction failed: {str(e)}")

    def process_file(self, file_path: str) -> str:
        """Auto-detect file type and process accordingly."""
        ext = Path(file_path).suffix.lower()

        if ext == ".pdf":
            raw = self.extract_pdf(file_path)
        elif ext == ".docx":
            raw = self.extract_docx(file_path)
        elif ext in [".txt", ".md"]:
            raw = self.extract_txt(file_path)
        else:
            raise FileUploadError(f"Unsupported file format: {ext}")

        cleaned = clean_text(raw)
        logger.info(f"Final cleaned text length: {len(cleaned)}")
        return cleaned


def get_preprocessor():
    return DocumentPreprocessor()
