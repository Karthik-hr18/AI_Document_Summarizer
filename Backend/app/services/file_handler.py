"""
File handling utilities for uploads:
- Extension validation
- Unique filename generation
- Safe storage + cleanup
"""

import os
import shutil
from fastapi import UploadFile, HTTPException
from app.utils import generate_unique_filename, remove_temp_file
from app.config import settings

# Use absolute directory instead of ./uploads
UPLOAD_DIR = settings.UPLOAD_FOLDER  # Example: "./uploads"
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "md"}


def is_allowed_file(filename: str) -> bool:
    """Return True if file extension is allowed."""
    ext = filename.rsplit(".", 1)[-1].lower()
    return ext in ALLOWED_EXTENSIONS


def save_upload_file(upload_file: UploadFile) -> str:
    """
    Save uploaded file temporarily and return its path.
    """
    if not is_allowed_file(upload_file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {upload_file.filename}"
        )

    try:
        # Ensure upload directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Create a unique filename but keep same extension
        unique_name = generate_unique_filename(upload_file.filename)
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        # Optional: validate file size
        max_size = getattr(settings, "MAX_UPLOAD_SIZE", None)
        if max_size and os.path.getsize(file_path) > max_size:
            os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail="File exceeds maximum allowed size"
            )

        return file_path

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save error: {str(e)}")


def cleanup_file(file_path: str):
    """Safely delete uploaded file."""
    try:
        remove_temp_file(file_path)
    except Exception:
        pass
