"""
LED Summarizer — improved version
- Token-aware chunking with overlap
- Optional parallel chunk summarization
- Recursive compression
- Defensive tokenizer limit forcing for LED
- Progress logging
Place at: app/services/ai_summarizer.py
"""

import os
import logging
import math
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

import torch
from transformers import AutoTokenizer, LEDForConditionalGeneration

from app.config import settings
from app.exceptions import SummarizationError

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def clean_text(text: str) -> str:
    if not text:
        return ""
    return " ".join(text.replace("\r", " ").replace("\n", " ").split()).strip()


class LEDSummarizer:
    """
    LED-only summarizer optimized for LED-base-4096 (but configurable).
    Configurable via settings:
      - HUGGINGFACE_MODEL
      - MODEL_TOKEN_LIMIT (e.g., 4096 or 16384)
      - MODEL_CACHE_DIR
      - LED_NUM_WORKERS (int, default 1) -> parallel chunk summarization
      - LED_CHUNK_OVERLAP (int tokens, default 64)
      - SUMMARIZATION_MAX_LENGTH, SUMMARIZATION_MIN_LENGTH
    """

    def __init__(self):
        self.model_name = settings.HUGGINGFACE_MODEL
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # model token limit (from .env), safe limit leaves some room for special tokens
        self.model_token_limit = int(getattr(settings, "MODEL_TOKEN_LIMIT", 4096))
        self.safe_limit = max(256, self.model_token_limit - 128)

        # chunking: recommended chunk size smaller than safe_limit
        # default chunk_size = min( self.safe_limit//2, 1024 )
        self.chunk_size = int(getattr(settings, "LED_CHUNK_SIZE", min(1024, max(256, self.safe_limit // 2))))
        # overlap in tokens between chunks to preserve context
        self.chunk_overlap = int(getattr(settings, "LED_CHUNK_OVERLAP", 64))

        # parallelism for chunk summarization (use 1 on small machines)
        self.num_workers = int(getattr(settings, "LED_NUM_WORKERS", 1))

        # generation params (tune as needed)
        self.gen_num_beams = int(getattr(settings, "LED_NUM_BEAMS", 4))
        self.gen_no_repeat_ngram_size = int(getattr(settings, "LED_NO_REPEAT_NGRAM_SIZE", 3))
        self.gen_early_stopping = bool(getattr(settings, "LED_EARLY_STOPPING", True))

        # load model + tokenizer
        self._load_model()

    # ------------------------------
    # Model & tokenizer loading
    # ------------------------------
    def _force_tokenizer_limit(self, tokenizer):
        """
        Force tokenizer to use model_token_limit to avoid HF warnings and ensure truncation works.
        Avoid deprecated attributes.
        """
        tokenizer.model_max_length = self.model_token_limit
        try:
            # ensure downstream code reading init_kwargs sees the value
            if getattr(tokenizer, "init_kwargs", None) is not None:
                tokenizer.init_kwargs["model_max_length"] = self.model_token_limit
        except Exception:
            pass

    def _load_model(self):
        try:
            os.makedirs(settings.MODEL_CACHE_DIR, exist_ok=True)

            logger.info(f"Loading tokenizer for {self.model_name} ...")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, cache_dir=settings.MODEL_CACHE_DIR)
            self._force_tokenizer_limit(self.tokenizer)

            logger.info(f"Loading LED model {self.model_name} ...")
            self.model = LEDForConditionalGeneration.from_pretrained(self.model_name, cache_dir=settings.MODEL_CACHE_DIR)
            self.model.to(self.device)

            logger.info(f"✅ LED loaded: {self.model_name} (device={self.device})")
            logger.info(f"settings: model_token_limit={self.model_token_limit} safe_limit={self.safe_limit} chunk_size={self.chunk_size} overlap={self.chunk_overlap} workers={self.num_workers}")

        except Exception as e:
            logger.exception("Model load failed")
            raise SummarizationError(f"Model load failed: {str(e)}")

    # ------------------------------
    # Token helpers & chunking
    # ------------------------------
    def _token_len(self, text: str) -> int:
        if not text:
            return 0
        ids = self.tokenizer.encode(text, truncation=False)
        return len(ids)

    def _encode_ids(self, text: str) -> List[int]:
        # Use tokenizer.encode with truncation=False to get full ids (caller must cap if required)
        return self.tokenizer.encode(text, truncation=False)

    def _chunk_ids_with_overlap(self, ids: List[int]) -> List[List[int]]:
        """
        Produce list of token-id chunks with overlap.
        Each chunk is a list of token ids of length <= chunk_size (except maybe last).
        Overlap is specified in tokens.
        """
        if not ids:
            return []

        step = max(1, self.chunk_size - self.chunk_overlap)
        chunks = []
        for i in range(0, len(ids), step):
            chunk = ids[i : i + self.chunk_size]
            if not chunk:
                break
            chunks.append(chunk)
            if i + self.chunk_size >= len(ids):
                break
        return chunks

    def _decode_chunk_ids(self, ids_chunk: List[int]) -> str:
        return self.tokenizer.decode(ids_chunk, skip_special_tokens=True)

    # ------------------------------
    # Single chunk safe summarize
    # ------------------------------
    def _generate_for_chunk(self, chunk_text: str, max_length: int, min_length: int) -> str:
        """
        Encode (truncated to safe_limit) and call model.generate with global attention.
        Returns decoded summary.
        """
        if not chunk_text:
            return ""

        enc = self.tokenizer(chunk_text, return_tensors="pt", truncation=True, max_length=self.safe_limit).to(self.device)

        # global attention (first token)
        global_attention_mask = torch.zeros_like(enc["input_ids"], dtype=torch.long)
        global_attention_mask[:, 0] = 1

        with torch.no_grad():
            out_ids = self.model.generate(
                input_ids=enc["input_ids"],
                attention_mask=enc["attention_mask"],
                global_attention_mask=global_attention_mask,
                max_length=max_length,
                min_length=min_length,
                num_beams=self.gen_num_beams,
                no_repeat_ngram_size=self.gen_no_repeat_ngram_size,
                early_stopping=self.gen_early_stopping,
            )

        return self.tokenizer.decode(out_ids[0], skip_special_tokens=True)

    # ------------------------------
    # Parallel chunk summarization helper
    # ------------------------------
    def _summarize_chunks_parallel(self, chunks_texts: List[str], max_length: int, min_length: int) -> List[str]:
        """
        Summarize a list of chunk texts. Uses ThreadPoolExecutor if num_workers > 1.
        Returns list of summaries in same order.
        """
        results = [None] * len(chunks_texts)

        if self.num_workers <= 1:
            # sequential
            for i, ch in enumerate(chunks_texts):
                try:
                    results[i] = self._generate_for_chunk(ch, max_length, min_length)
                except Exception:
                    logger.exception(f"Chunk {i+1} summarization failed; inserting empty string")
                    results[i] = ""
            return results

        # parallel using threads (torch releases GIL during heavy ops)
        with ThreadPoolExecutor(max_workers=self.num_workers) as ex:
            future_to_idx = {ex.submit(self._generate_for_chunk, ch, max_length, min_length): idx for idx, ch in enumerate(chunks_texts)}
            for fut in as_completed(future_to_idx):
                idx = future_to_idx[fut]
                try:
                    results[idx] = fut.result()
                except Exception:
                    logger.exception(f"Parallel chunk {idx+1} failed")
                    results[idx] = ""

        return results

    # ------------------------------
    # Recursive compression
    # ------------------------------
    def _recursive_compress(self, text: str, max_length: int, min_length: int) -> str:
        """
        Repeatedly chunk -> summarize -> join until combined fits within safe_limit.
        Returns compressed intermediate.
        """
        if not text:
            return ""

        token_count = self._token_len(text)
        logger.debug(f"_recursive_compress called: tokens={token_count}")

        if token_count <= self.safe_limit:
            return text

        # convert to ids once, then chunk ids to preserve exact token boundaries
        ids = self._encode_ids(text)

        # cap runaway text extremely large (avoid enormous loops). Keep up to 4x model_token_limit.
        max_allowed_ids = self.model_token_limit * 4
        if len(ids) > max_allowed_ids:
            logger.warning(f"Very large input truncated at {max_allowed_ids} tokens from {len(ids)} tokens")
            ids = ids[:max_allowed_ids]

        id_chunks = self._chunk_ids_with_overlap(ids)
        logger.info(f"Breaking input ({len(ids)} tokens) into {len(id_chunks)} chunks (chunk_size={self.chunk_size} overlap={self.chunk_overlap})")

        # decode chunks to text
        chunks_texts = [self._decode_chunk_ids(c) for c in id_chunks]

        # summarize chunks (parallel or sequential)
        chunk_summaries = self._summarize_chunks_parallel(chunks_texts, max_length, min_length)

        # join and recurse if still too long
        combined = " ".join(s for s in chunk_summaries if s)

        if self._token_len(combined) > self.safe_limit:
            logger.info("Combined chunk summaries still exceed safe_limit — recursing further.")
            return self._recursive_compress(combined, max_length, min_length)

        return combined

    # ------------------------------
    # Public summarize
    # ------------------------------
    def summarize(self, text: str, max_length: Optional[int] = None, min_length: Optional[int] = None) -> str:
        """
        Public method:
        - clean text
        - build compressed intermediate that fits safe_limit
        - run final generate to produce final summary
        """
        if not text or not text.strip():
            raise SummarizationError("Input text is empty")

        text = clean_text(text)
        max_len = int(max_length or settings.SUMMARIZATION_MAX_LENGTH)
        min_len = int(min_length or settings.SUMMARIZATION_MIN_LENGTH)

        try:
            compressed = self._recursive_compress(text, max_len, min_len)
            logger.debug(f"Compressed intermediate length tokens={self._token_len(compressed)}")
            # final generation (safe)
            final = self._generate_for_chunk(compressed, max_len, min_len)
            logger.info(f"Final summary produced (in_tokens={self._token_len(compressed)} out_tokens={self._token_len(final)})")
            return final

        except SummarizationError:
            raise
        except Exception as e:
            logger.exception("Summarization failed internally")
            raise SummarizationError(f"Summarization failed internally: {str(e)}")


# singleton helper
_summarizer: Optional[LEDSummarizer] = None


def get_summarizer() -> LEDSummarizer:
    global _summarizer
    if _summarizer is None:
        _summarizer = LEDSummarizer()
    return _summarizer
