# Authentication Routes

import os
from datetime import UTC, datetime, timedelta

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.rate_limiter import rate_limit

from database import get_db
from models.models import User
from models.schemas import (
    ErrorResponse,
    LoginRequest,
    SuccessResponse,
    TokenResponse,
    UserCreate,
    UserResponse,
)

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

_SECRET_RAW = os.environ.get("JWT_SECRET_KEY", "")
if not _SECRET_RAW:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is required. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )
_DEV_SECRETS = frozenset({
    "viswah-dev-secret-key-change-in-production-2024",
    "dev-fallback-secret-key-do-not-use-in-production",
})
if _SECRET_RAW in _DEV_SECRETS:
    import sys
    print(
        "WARNING: JWT_SECRET_KEY is a known development value. "
        "This is NOT secure for production. Set a unique secret via environment variable.",
        file=sys.stderr,
    )
SECRET_KEY = _SECRET_RAW

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "purpose": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_reset_token(email: str):
    to_encode = {"sub": email}
    expire = datetime.now(UTC) + timedelta(minutes=15)
    to_encode.update({"exp": expire, "purpose": "reset"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Reject reset-purpose tokens — they must not be usable as access tokens
        if payload.get("purpose") == "reset":
            raise credentials_exception
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"model": ErrorResponse, "description": "Email already registered"}},
    dependencies=[Depends(rate_limit("auth_register"))],
)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=409, detail="Username already taken")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    db.add(new_user)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or username already taken")
    db.refresh(new_user)
    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    responses={401: {"model": ErrorResponse, "description": "Incorrect email or password"}},
    dependencies=[Depends(rate_limit("auth_login"))],
)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(access_token=create_access_token(data={"sub": user.email}))


@router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or missing token"},
        404: {"model": ErrorResponse, "description": "User not found"}
    }
)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    level: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.put(
    "/password",
    response_model=SuccessResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Current password incorrect"},
    }
)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return SuccessResponse(message="Password updated successfully")


class ForgotPasswordRequest(BaseModel):
    email: str


@router.post(
    "/forgot-password",
    response_model=SuccessResponse,
    dependencies=[Depends(rate_limit("auth_forgot"))],
)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Always return generic response to prevent user enumeration.
    # In production, send reset email here if user exists.
    # Do NOT return reset_token to client.
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        # Token generated for email delivery — not returned to client.
        # Production: send via email service. See docs/SECURITY.md.
        create_reset_token(data.email)
    return SuccessResponse(message="If an account exists with that email, a reset link has been sent.")


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post(
    "/reset-password",
    response_model=SuccessResponse,
    responses={400: {"model": ErrorResponse}},
    dependencies=[Depends(rate_limit("auth_reset"))],
)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") != "reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid reset token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return SuccessResponse(message="Password reset successfully")


@router.patch(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or missing token"},
    }
)
def update_current_user(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if updates.username is not None:
        existing = db.query(User).filter(User.username == updates.username, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Username already taken")
        current_user.username = updates.username
    if updates.email is not None:
        existing = db.query(User).filter(User.email == updates.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already in use")
        current_user.email = updates.email
    if updates.level is not None:
        if updates.level not in ("beginner", "intermediate", "advanced"):
            raise HTTPException(status_code=400, detail="Invalid level")
        current_user.level = updates.level
    db.commit()
    db.refresh(current_user)
    return current_user