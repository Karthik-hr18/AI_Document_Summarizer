"""
Document management service.
Handles upload validation and file storing for each user.
"""

import os
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import settings

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "md"}


def is_allowed_file(filename: str) -> bool:
    """Check extension."""
    ext = filename.rsplit(".", 1)[-1].lower()
    return ext in ALLOWED_EXTENSIONS


async def save_upload_file(upload_file: UploadFile, user_id: str) -> str:
    """Save file inside user-specific folder."""
    if not is_allowed_file(upload_file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")

    user_folder = Path(settings.UPLOAD_FOLDER) / str(user_id)
    user_folder.mkdir(parents=True, exist_ok=True)

    file_path = user_folder / upload_file.filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return str(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Saving failed: {str(e)}")


def validate_file_size(file_path: str) -> None:
    """Validate file size does not exceed max limit."""
    max_size = settings.MAX_UPLOAD_SIZE
    actual_size = os.path.getsize(file_path)

    if actual_size > max_size:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="File too large")
