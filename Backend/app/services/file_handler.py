import os
import shutil
import tempfile
from fastapi import UploadFile, HTTPException
from app.utils import generate_unique_filename, remove_temp_file

UPLOAD_DIR = "./uploads"

def save_upload_file(upload_file: UploadFile) -> str:
    """Save uploaded file temporarily and return its path."""
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        unique_name = generate_unique_filename(upload_file.filename)
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        return file_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

def cleanup_file(file_path: str):
    """Remove a file safely after processing."""
    remove_temp_file(file_path)
