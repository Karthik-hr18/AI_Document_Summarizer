import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    HUGGINGFACE_MODEL: str = os.getenv("HUGGINGFACE_MODEL", "facebook/bart-large-cnn")
    MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", "./model_cache")
    SUMMARIZATION_MAX_LENGTH: int = int(os.getenv("SUMMARIZATION_MAX_LENGTH", 200))
    SUMMARIZATION_MIN_LENGTH: int = int(os.getenv("SUMMARIZATION_MIN_LENGTH", 30))

settings = Settings()
