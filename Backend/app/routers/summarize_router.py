from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.ai_summarizer import get_summarizer
from app.services.preprocessing import get_preprocessor
from app.services.file_handler import save_upload_file, cleanup_file
from app.schemas import SummaryRequest, SummaryResponse, DocumentCreate
from app.models import User
from app.database import get_db
from app.auth.dependencies import get_current_user
from app import crud

router = APIRouter(prefix="/summarizer", tags=["Summarizer"])



# Summarize Plain Text
@router.post("/text", response_model=SummaryResponse)
def summarize_text(
    request: SummaryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    summarizer = get_summarizer()
    text = request.document_id

    if not text.strip():
        raise HTTPException(status_code=400, detail="Text input cannot be empty")

    try:
        summary = summarizer.summarize(
            text,
            max_length=request.max_length,
            min_length=request.min_length
        )

        # Save result in PostgreSQL
        doc_in = DocumentCreate(title="Text Summary", content=text, summary=summary)
        crud.create_document(db=db, user_id=current_user.id, doc=doc_in)

        return SummaryResponse(
            document_id="text_input",
            summary=summary,
            summary_length=len(summary),
            original_length=len(text)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


# Summarize Uploaded File
@router.post("/file", response_model=SummaryResponse)
async def summarize_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    preprocessor = get_preprocessor()
    summarizer = get_summarizer()

    # Use file handler to save the uploaded file
    file_path = save_upload_file(file)

    try:
        # Extract & clean text from uploaded file
        text = preprocessor.process_file(file_path)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Failed to extract text from file")

        # Generate summary
        summary = summarizer.summarize(text)

        # Save summarized document in DB
        doc_in = DocumentCreate(title=file.filename, content=text, summary=summary)
        crud.create_document(db=db, user_id=current_user.id, doc=doc_in)

        return SummaryResponse(
            document_id=file.filename,
            summary=summary,
            summary_length=len(summary),
            original_length=len(text)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

    finally:
        # Always remove the uploaded file (temporary cleanup)
        cleanup_file(file_path)
