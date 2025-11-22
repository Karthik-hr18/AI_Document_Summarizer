# services/summary_storage.py
from typing import Optional
from sqlalchemy.orm import Session
from app import models

def save_summary(db: Session, document_id: int, summary_text: str) -> bool:
    """
    Save or update the summary text for a given document id.
    Returns True if the update was acknowledged (document existed).
    """
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        return False

    doc.summary = summary_text
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return True


def get_summary(db: Session, document_id: int) -> Optional[str]:
    """
    Return the summary for a document, or None if not found.
    """
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    return doc.summary if doc else None
