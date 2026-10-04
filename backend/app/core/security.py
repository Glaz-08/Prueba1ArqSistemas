from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.usuario import Usuario

ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def crear_token(usuario: Usuario) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=settings.token_expire_minutos)
    payload = {
        "sub": usuario.id,
        "username": usuario.username,
        "rol": usuario.rol,
        "exp": expira,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def crear_token_reset(usuario: Usuario) -> str:
    """Token de vida corta (15 min) para reset de contraseña."""
    expira = datetime.now(timezone.utc) + timedelta(minutes=15)
    payload = {
        "sub": usuario.id,
        "username": usuario.username,
        "tipo": "reset_password",
        "exp": expira,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def verificar_token_reset(token: str, db: Session) -> Usuario | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    if payload.get("tipo") != "reset_password":
        return None
    usuario = db.query(Usuario).filter(Usuario.id == payload.get("sub")).first()
    if usuario is None or not usuario.activo:
        return None
    return usuario


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    credenciales = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sesión inválida o vencida",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise credenciales
    usuario = db.query(Usuario).filter(Usuario.id == payload.get("sub")).first()
    if usuario is None or not usuario.activo:
        raise credenciales
    return usuario


def require_admin(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    if usuario.rol != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol administrador")
    return usuario
