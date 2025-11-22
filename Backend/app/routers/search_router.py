from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models import User
from app.schemas import DocumentOut
from app.services.search_service import search_documents, search_summaries

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/documents", response_model=list[DocumentOut])
def search_docs(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Full-text search in document title + content.
    """
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    result = search_documents(db, q)

    # Extract only Documents from {"document": doc, "rank": rank}
    docs = [item["document"] for item in result]

    return docs


@router.get("/summaries", response_model=list[DocumentOut])
def search_summaries_route(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Full-text search in document summaries.
    """
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    result = search_summaries(db, q)
    docs = [item["document"] for item in result]

    return docs
