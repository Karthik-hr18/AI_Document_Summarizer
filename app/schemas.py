from pydantic import BaseModel, EmailStr, validator, constr
from datetime import datetime
from typing import Optional

MAX_BCRYPT_LENGTH = 72



class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: constr(min_length=8, max_length=MAX_BCRYPT_LENGTH)
    confirm_password: constr(min_length=8, max_length=MAX_BCRYPT_LENGTH)

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v


class UserLogin(BaseModel):
    username: str
    password: constr(min_length=8, max_length=MAX_BCRYPT_LENGTH)
    
class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True  



class Token(BaseModel):
    access_token: str
    token_type: str

class DocumentCreate(BaseModel):
    """
    Used when creating a new summarized document record.
    """
    title: str
    content: str
    summary: Optional[str] = None


class DocumentOut(BaseModel):
    """
    Used when returning a document or summary record to the frontend.
    """
    id: int
    title: str
    content: Optional[str] = None
    summary: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True  


class SummaryRequest(BaseModel):
    """
    Request payload for text summarization.
    """
    text: str
    max_length: Optional[int] = None
    min_length: Optional[int] = None


class SummaryResponse(BaseModel):
    """
    Response payload returned after summarization.
    """
    document_id: str
    summary: str
    summary_length: int
    original_length: int
