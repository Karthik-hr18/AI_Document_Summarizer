# app/auth/hash.py
from passlib.context import CryptContext

#bcrypt_sha256 wraps bcrypt internally but safely handles long passwords
pwd_context = CryptContext(
    schemes=["bcrypt_sha256"],
    deprecated="auto",
)

def hash_password(password: str) -> str:
    """
    Securely hash a password using bcrypt_sha256.
    Handles passwords >72 bytes automatically.
    """
    try:
        return pwd_context.hash(password)
    except Exception as e:
        # fallback truncation (very rare case)
        print(f"[WARN] Password hashing error: {e}. Truncating to 72 chars.")
        password = password[:72]
        return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its bcrypt_sha256 hash.
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"[WARN] Password verification error: {e}")
        return False
