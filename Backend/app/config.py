import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")

    # AI Model Settings (local fallback)
    HUGGINGFACE_MODEL: str = os.getenv("HUGGINGFACE_MODEL", "pszemraj/led-base-book-summary")
    MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", "./model_cache")
    SUMMARIZATION_MAX_LENGTH: int = int(os.getenv("SUMMARIZATION_MAX_LENGTH", 200))
    SUMMARIZATION_MIN_LENGTH: int = int(os.getenv("SUMMARIZATION_MIN_LENGTH", 30))
    MODEL_TOKEN_LIMIT: int = int(os.getenv("MODEL_TOKEN_LIMIT", 4096))

    # File Upload Settings
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", "./uploads")
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", 10 * 1024 * 1024))  # 10MB default

    # --- Remote (Groq) Settings ---
    # Use Groq chat completions endpoint (OpenAI-compatible shape)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_API_URL: str = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
    # Default to the large mixtral 32K-window model for option C
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")

    REMOTE_CHUNK_CHAR_FACTOR: float = float(os.getenv("REMOTE_CHUNK_CHAR_FACTOR", 4.0))
    REMOTE_CHUNK_OVERLAP_CHARS: int = int(os.getenv("REMOTE_CHUNK_OVERLAP_CHARS", 512))
    REMOTE_NUM_WORKERS: int = int(os.getenv("REMOTE_NUM_WORKERS", 1))
    REMOTE_REQ_TIMEOUT: float = float(os.getenv("REMOTE_REQ_TIMEOUT", 60.0))
    REMOTE_MAX_RETRIES: int = int(os.getenv("REMOTE_MAX_RETRIES", 2))
    REMOTE_FINAL_SUMMARIZE: bool = os.getenv("REMOTE_FINAL_SUMMARIZE", "true").lower() in ("1","true","yes")

settings = Settings()
