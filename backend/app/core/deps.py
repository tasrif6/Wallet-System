from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models import User, Role, AccountStatus
from app.core.security import decode_subject

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
):
    try:
        uid = decode_subject(token)
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials"
        )
    user = await db.scalar(select(User).where(User.id == uid))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def active_user(user=Depends(current_user)):
    if user.status == AccountStatus.FROZEN:
        raise HTTPException(status_code=403, detail="Account is frozen")
    return user


async def admin_user(user=Depends(current_user)):
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
