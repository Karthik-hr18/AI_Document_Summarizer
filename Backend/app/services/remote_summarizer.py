"""
Ultra-Stable Remote Summarizer (Groq)
- Small safe chunks
- Cloudflare-proof User-Agent
- Clear structured ChatGPT-style output
"""

import logging
import httpx
from typing import List
from app.config import settings
from app.exceptions import SummarizationError


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class RemoteSummarizer:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.api_url = settings.GROQ_API_URL
        self.model = settings.GROQ_MODEL  # recommended: llama-3.3-70b-versatile

        if not self.api_key:
            raise SummarizationError("❌ GROQ_API_KEY missing in .env")

        # Small safe chunks — avoids 500 + 400 errors
        self.chunk_chars = 4000
        self.chunk_overlap = 250

        self.timeout = float(settings.REMOTE_REQ_TIMEOUT)
        self.max_retries = int(settings.REMOTE_MAX_RETRIES)
        self.do_final = bool(settings.REMOTE_FINAL_SUMMARIZE)

        logger.info(f"Groq Summarizer Active → model={self.model}")


    # -------------------------------------------------------
    # SAFE CHUNKING
    # -------------------------------------------------------
    def _chunk_text(self, text: str) -> List[str]:
        text = " ".join(text.split())
        n = len(text)

        if n <= self.chunk_chars:
            return [text]

        chunks = []
        step = self.chunk_chars - self.chunk_overlap

        for i in range(0, n, step):
            part = text[i: i + self.chunk_chars]
            chunks.append(part)
            if i + self.chunk_chars >= n:
                break

        logger.info(f"📌 Chunking complete → {len(chunks)} chunks")
        return chunks


    # -------------------------------------------------------
    # PROFESSIONAL STRUCTURED PROMPT (ChatGPT-style)
    # -------------------------------------------------------
    def _build_prompt(self, chunk: str) -> str:
        return (
            "You are a professional academic summarizer. Produce a clean, "
            "high-quality, human-sounding structured summary.\n\n"
            "OUTPUT FORMAT:\n"
            "TL;DR:\n• One concise sentence.\n\n"
            "KEY POINTS:\n• 3–6 crisp bullet points.\n\n"
            "DETAILED BREAKDOWN:\n1. Numbered explanation points.\n2. Cover important concepts.\n\n"
            "CONCLUSION:\n• 1–2 clear concluding bullets.\n\n"
            "Summarize the following text:\n\n"
            f"{chunk}"
        )


    # -------------------------------------------------------
    # CALL GROQ (CLOUDFLARE-PROTECTED)
    # -------------------------------------------------------
    def _call_groq(self, prompt: str, max_tokens: int = 1200) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Groq-Python-Client/1.0"  # IMPORTANT: prevents Cloudflare HTML errors
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You summarize clearly, professionally, and accurately."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": 0.15,
        }

        last = None

        for attempt in range(self.max_retries + 1):
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    res = client.post(self.api_url, headers=headers, json=payload)

                    logger.info(f"Groq status={res.status_code}")

                    if res.status_code == 400:
                        raise SummarizationError(
                            f"❌ Groq 400 Bad Request → Input too large or malformed.\n"
                            f"Response: {res.text}"
                        )

                    res.raise_for_status()
                    data = res.json()
                    return data["choices"][0]["message"]["content"]

            except httpx.HTTPStatusError as e:
                last = e

                # Retry on server-side issues
                if e.response.status_code in (429, 500, 502, 503, 504):
                    logger.warning("Groq busy → retrying...")
                    continue

                raise SummarizationError(f"Groq error {e.response.status_code}: {e.response.text}")

            except Exception as e:
                last = e
                logger.warning(f"Groq call failed: {e}")

        raise SummarizationError(f"Groq failed after retries: {last}")


    # -------------------------------------------------------
    # PUBLIC SUMMARIZATION
    # -------------------------------------------------------
    def summarize(self, text: str, max_length=None, min_length=None) -> str:
        chunks = self._chunk_text(text)

        partials = []
        for i, chunk in enumerate(chunks):
            logger.info(f"🔥 Summarizing chunk {i+1}/{len(chunks)}")
            summary = self._call_groq(self._build_prompt(chunk))
            partials.append(summary)

        combined = "\n\n".join(partials)

        if not self.do_final:
            return combined

        # Final pass — safe <10k chars
        final_text = combined[:9500]

        final_prompt = (
            "Merge ALL chunk summaries into ONE polished, highly professional final summary.\n\n"
            "Follow the exact structure:\n"
            "TL;DR → 1 sentence\n"
            "Key Points → 3–6 bullets\n"
            "Detailed Breakdown → numbered\n"
            "Conclusion → 1–2 bullets\n\n"
            f"{final_text}"
        )

        return self._call_groq(final_prompt, max_tokens=1500)



# -------------------------------------------------------
# SINGLETON
# -------------------------------------------------------
_remote_summarizer = None

def get_remote_summarizer():
    global _remote_summarizer
    if _remote_summarizer is None:
        _remote_summarizer = RemoteSummarizer()
    return _remote_summarizer
