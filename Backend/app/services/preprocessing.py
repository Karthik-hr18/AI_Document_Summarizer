"""Document Preprocessing Service"""
import re
from pathlib import Path
import PyPDF2
import docx

from app.exceptions import FileUploadError


class DocumentPreprocessor:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text.strip()
        except Exception as e:
            raise FileUploadError(f"Failed to extract text from PDF: {str(e)}")

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        try:
            doc = docx.Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            raise FileUploadError(f"Failed to extract text from DOCX: {str(e)}")

    @staticmethod
    def extract_text_from_txt(file_path: str) -> str:
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read().strip()
        except Exception as e:
            raise FileUploadError(f"Failed to read text file: {str(e)}")

    @staticmethod
    def clean_text(text: str) -> str:
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s.,!?;:\-\'\"]', '', text)
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        return text.strip()

    def process_file(self, file_path: str) -> str:
        extension = Path(file_path).suffix.lower()

        if extension == '.pdf':
            text = self.extract_text_from_pdf(file_path)
        elif extension == '.docx':
            text = self.extract_text_from_docx(file_path)
        elif extension in ['.txt', '.md']:
            text = self.extract_text_from_txt(file_path)
        else:
            raise FileUploadError(f"Unsupported file format: {extension}")

        return self.clean_text(text)


def get_preprocessor() -> DocumentPreprocessor:
    return DocumentPreprocessor()
