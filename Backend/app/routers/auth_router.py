from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas import UserCreate, UserLogin, Token
from app.auth import hash
from app.database import get_db
from app.models import User  # Your SQLAlchemy user model
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
import jwt

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Registration route
@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if username or email exists
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    # Hash the password
    hashed_pwd = hash.hash_password(user.password)

    # Create user in DB
    new_user = User(username=user.username, email=user.email, password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create JWT token
    access_token = jwt.encode(
        {"sub": new_user.username, "exp": datetime.utcnow() + timedelta(hours=1)},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Login route
@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not hash.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token = jwt.encode(
        {"sub": db_user.username, "exp": datetime.utcnow() + timedelta(hours=1)},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    return {"access_token": access_token, "token_type": "bearer"}


