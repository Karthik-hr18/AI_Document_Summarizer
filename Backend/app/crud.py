"""Database CRUD operations for Users and Documents"""

from sqlalchemy.orm import Session
from app import models, schemas
from app.auth.hash import hash_password


def get_user_by_email(db: Session, email: str):
    """
    Retrieve a user by email.
    """
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    """
    Retrieve a user by ID.
    """
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user: schemas.UserCreate):
    """
    Create a new user with a hashed password.
    """
    hashed_pwd = hash_password(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pwd
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_document(db: Session, user_id: int, doc: schemas.DocumentCreate):
    """
    Save a summarized document linked to a specific user.
    """
    db_doc = models.Document(
        title=doc.title,
        content=doc.content,
        summary=doc.summary,
        user_id=user_id
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc


def get_user_documents(db: Session, user_id: int):
    """
    Get all summarized documents created by a specific user.
    """
    return db.query(models.Document).filter(models.Document.user_id == user_id).all()


def get_document_by_id(db: Session, doc_id: int):
    """
    Retrieve a single summarized document by ID.
    """
    return db.query(models.Document).filter(models.Document.id == doc_id).first()
