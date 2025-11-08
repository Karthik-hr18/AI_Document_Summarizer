"""AI Summarization Service"""
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from typing import Optional
import torch
import os

from app.config import settings
from app.exceptions import SummarizationError


class AISummarizer:
    def __init__(self):
        self.model_name = settings.HUGGINGFACE_MODEL
        self.device = 0 if torch.cuda.is_available() else -1
        self.tokenizer = None
        self.model = None
        self.pipeline = None
        self._initialize_model()

    def _initialize_model(self):
        try:
            print(f"⚙️ Loading model: {self.model_name}...")
            print(f"Using device: {'GPU' if self.device == 0 else 'CPU'}")

            # Ensure cache directory exists
            os.makedirs(settings.MODEL_CACHE_DIR, exist_ok=True)

            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                cache_dir=settings.MODEL_CACHE_DIR
            )
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                self.model_name,
                cache_dir=settings.MODEL_CACHE_DIR
            )

            self.pipeline = pipeline(
                "summarization",
                model=self.model,
                tokenizer=self.tokenizer,
                device=self.device
            )

            print("✅ Model loaded successfully and ready!")
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            raise SummarizationError(f"Failed to load AI model: {str(e)}")

    def summarize(
        self,
        text: str,
        max_length: Optional[int] = None,
        min_length: Optional[int] = None
    ) -> str:
        try:
            # 🧹 Clean text
            if not text or not text.strip():
                raise SummarizationError("Input text is empty or invalid.")

            max_len = max_length or settings.SUMMARIZATION_MAX_LENGTH
            min_len = min_length or settings.SUMMARIZATION_MIN_LENGTH

            # ⚠️ Truncate if text is too long (Bart limit ~1024 tokens)
            tokens = self.tokenizer.encode(text, truncation=True, max_length=1024)
            text = self.tokenizer.decode(tokens, skip_special_tokens=True)

            result = self.pipeline(
                text,
                max_length=max_len,
                min_length=min_len,
                do_sample=False,
                num_beams=4,
                length_penalty=2.0,
                early_stopping=True
            )

            if not result or "summary_text" not in result[0]:
                raise SummarizationError("Model returned empty summary.")

            return result[0]["summary_text"]

        except SummarizationError:
            raise
        except Exception as e:
            raise SummarizationError(f"Summarization failed internally: {str(e)}")


# Singleton instance (model loads only once)
_summarizer_instance = None


def get_summarizer() -> AISummarizer:
    global _summarizer_instance
    if _summarizer_instance is None:
        _summarizer_instance = AISummarizer()
    return _summarizer_instance
