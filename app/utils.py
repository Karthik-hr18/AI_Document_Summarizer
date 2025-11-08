# app/utils.py
import os
import uuid
import shutil
from datetime import datetime

def generate_unique_filename(filename: str) -> str:
    """Generate a unique file name using UUID."""
    ext = os.path.splitext(filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    return unique_name

def remove_temp_file(file_path: str):
    """Safely remove a temporary file if it exists."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"⚠️ Error deleting file {file_path}: {e}")

def timestamp() -> str:
    """Return current timestamp (ISO format)."""
    return datetime.utcnow().isoformat()

def move_file(src_path: str, dest_dir: str) -> str:
    """Move file to a destination folder (creating it if necessary)."""
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, os.path.basename(src_path))
    shutil.move(src_path, dest_path)
    return dest_path
