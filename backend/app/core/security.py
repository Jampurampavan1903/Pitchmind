import os
import secrets
from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException, status

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    # Auto-generate a secure random 64-char hex key if not present in env for security fallback
    JWT_SECRET_KEY = secrets.token_hex(32)

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = int(os.getenv("JWT_EXPIRY_DAYS", "7"))

def create_access_token(user_id: str) -> str:
    """Signs a JWT payload containing 'sub' (user_id) and 'exp' (expiration timestamp)."""
    now = datetime.utcnow()
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(days=JWT_EXPIRY_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> str:
    """Verifies the JWT signature, checks expiration, and extracts the user_id (sub)."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has no subject"
            )
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid security token"
        )
