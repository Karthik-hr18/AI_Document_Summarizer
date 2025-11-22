from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import asyncio
import logging

from app.services.remote_summarizer import get_remote_summarizer
from app.services.preprocessing import get_preprocessor
from app.services.file_handler import save_upload_file, cleanup_file

from app.schemas import SummaryRequest, SummaryResponse, DocumentCreate
from app.models import User
from app.database import get_db
from app.auth.dependencies import get_current_user
from app import crud

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/summarizer", tags=["Summarizer"])


# -----------------------------
# TEXT SUMMARIZATION
# -----------------------------
@router.post("/text", response_model=SummaryResponse)
async def summarize_text(
    request: SummaryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    summarizer = get_remote_summarizer()

    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text input cannot be empty")

    try:
        summary = await asyncio.to_thread(
            summarizer.summarize,
            request.text,
            request.max_length,
            request.min_length,
        )

        # Save to DB
        doc_in = DocumentCreate(
            title="Text Summary",
            content=request.text,
            summary=summary
        )
        crud.create_document(db, current_user.id, doc_in)

        return SummaryResponse(
            document_id="text_input",
            summary=summary,
            summary_length=len(summary),
            original_length=len(request.text),
        )

    except Exception as e:
        logger.exception("Text summarization failed")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


# -----------------------------
# FILE SUMMARIZATION
# -----------------------------
@router.post("/file", response_model=SummaryResponse)
async def summarize_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    preprocessor = get_preprocessor()
    summarizer = get_remote_summarizer()

    file_path = await asyncio.to_thread(save_upload_file, file)
    logger.info(f"Saved uploaded file to {file_path}")

    try:
        text = await asyncio.to_thread(preprocessor.process_file, file_path)

        if not text.strip():
            raise HTTPException(status_code=400, detail="No readable text found in file.")

        summary = await asyncio.to_thread(summarizer.summarize, text)

        # Save to DB
        doc_in = DocumentCreate(
            title=file.filename,
            content=text,
            summary=summary
        )
        crud.create_document(db, current_user.id, doc_in)

        return SummaryResponse(
            document_id=file.filename,
            summary=summary,
            summary_length=len(summary),
            original_length=len(text),
        )

    except Exception as e:
        logger.exception("File summarization failed")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

    finally:
        await asyncio.to_thread(cleanup_file, file_path)
