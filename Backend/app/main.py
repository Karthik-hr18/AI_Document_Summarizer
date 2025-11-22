from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth_router, user_router, summarize_router, search_router
from app.database import engine
from app.models import Base
import os

os.makedirs("uploads", exist_ok=True)
os.makedirs("model_cache", exist_ok=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Document Summarizer")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(summarize_router.router)
app.include_router(search_router.router)   # <-- ADD THIS LINE

@app.get("/")
def read_root():
    return {"message": "✅ Auth + AI Summarizer backend running!"}

@app.get("/health")
def health():
    return {"status": "ok"}
