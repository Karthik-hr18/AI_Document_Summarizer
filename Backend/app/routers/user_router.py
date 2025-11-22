from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.auth.dependencies import get_current_user
from app import crud, schemas

router = APIRouter(prefix="/user", tags=["user"])  # keep singular for consistency with frontend


@router.get("/me", response_model=schemas.UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Return profile information of the currently logged-in user.
    """
    return current_user


@router.get("/history", response_model=list[schemas.DocumentOut])
def get_user_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all document summaries created by the current user.
    ALWAYS return a list — never raise 404.
    This fixes the bug where the frontend shows empty history.
    """
    docs = crud.get_user_documents(db, current_user.id)
    return docs  # return empty list if no documents
