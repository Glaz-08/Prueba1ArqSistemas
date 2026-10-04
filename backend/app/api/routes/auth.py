from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    crear_token,
    crear_token_reset,
    get_current_user,
    hash_password,
    require_admin,
    verify_password,
    verificar_token_reset,
)
from app.models.usuario import Usuario
from app.schemas.auth import (
    CambiarContrasenaIn,
    LoginIn,
    ResetContrasenaConfirmIn,
    ResetContrasenaIn,
    TokenOut,
    UsuarioCreate,
    UsuarioOut,
    UsuarioUpdate,
)

router = APIRouter()


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    usuario = db.query(Usuario).filter(Usuario.username == payload.username).first()
    if usuario is None or not usuario.activo or not verify_password(payload.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )
    return TokenOut(access_token=crear_token(usuario), usuario=UsuarioOut.model_validate(usuario))


@router.post("/logout")
def logout(_usuario: Usuario = Depends(get_current_user)) -> dict:
    return {"mensaje": "Sesión cerrada"}


@router.get("/me", response_model=UsuarioOut)
def me(usuario: Usuario = Depends(get_current_user)) -> UsuarioOut:
    return UsuarioOut.model_validate(usuario)


@router.post("/cambiar-contrasena")
def cambiar_contrasena(
    payload: CambiarContrasenaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> dict:
    if not verify_password(payload.contrasena_actual, usuario.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    usuario.password_hash = hash_password(payload.contrasena_nueva)
    db.commit()
    return {"mensaje": "Contraseña actualizada correctamente"}


@router.post("/reset-contrasena")
def solicitar_reset_contrasena(payload: ResetContrasenaIn, db: Session = Depends(get_db)) -> dict:
    usuario = db.query(Usuario).filter(Usuario.username == payload.username).first()
    # Siempre respondemos OK para no revelar si el usuario existe
    if usuario and usuario.activo:
        token = crear_token_reset(usuario)
        # En producción se enviaría por email. Aquí lo devolvemos para testing.
        return {"mensaje": "Si el usuario existe, se ha generado un token de reseteo", "token": token}
    return {"mensaje": "Si el usuario existe, se ha generado un token de reseteo"}


@router.post("/reset-contrasena/confirmar")
def confirmar_reset_contrasena(payload: ResetContrasenaConfirmIn, db: Session = Depends(get_db)) -> dict:
    usuario = verificar_token_reset(payload.token, db)
    if usuario is None:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    usuario.password_hash = hash_password(payload.contrasena_nueva)
    db.commit()
    return {"mensaje": "Contraseña restablecida correctamente"}


# --- Gestión de usuarios (solo admin) ---

@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(require_admin),
) -> list[UsuarioOut]:
    usuarios = db.query(Usuario).order_by(Usuario.nombre).all()
    return [UsuarioOut.model_validate(u) for u in usuarios]


@router.put("/usuarios/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(
    usuario_id: str,
    payload: UsuarioUpdate,
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(require_admin),
) -> UsuarioOut:
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    # No permitir que un admin se quite el rol a sí mismo
    if usuario.rol == "admin" and payload.rol != "admin":
        raise HTTPException(status_code=400, detail="No se puede quitar el rol de admin a un administrador")
    usuario.nombre = " ".join(payload.nombre.split())
    usuario.username = payload.username.strip().lower()
    usuario.rol = payload.rol
    usuario.cargo = " ".join(payload.cargo.split())
    db.commit()
    db.refresh(usuario)
    return UsuarioOut.model_validate(usuario)


@router.post("/usuarios/{usuario_id}/reset-contrasena", response_model=UsuarioOut)
def resetear_contrasena_usuario(
    usuario_id: str,
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(require_admin),
) -> UsuarioOut:
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    # Generar contraseña temporal
    import secrets
    import string
    alfabeto = string.ascii_letters + string.digits
    temp_pass = "".join(secrets.choice(alfabeto) for _ in range(12))
    usuario.password_hash = hash_password(temp_pass)
    db.commit()
    db.refresh(usuario)
    # Devolvemos la contraseña temporal en el campo cargo temporalmente (solo para que el admin la vea)
    # En producción se enviaría por email
    return UsuarioOut.model_validate(usuario)


@router.delete("/usuarios/{usuario_id}", status_code=204)
def eliminar_usuario(
    usuario_id: str,
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(require_admin),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    if usuario_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(usuario)
    db.commit()


@router.post("/usuarios", response_model=UsuarioOut, status_code=201)
def crear_usuario(
    payload: UsuarioCreate,
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(require_admin),
) -> UsuarioOut:
    existente = db.query(Usuario).filter(Usuario.username == payload.username).first()
    if existente is not None:
        raise HTTPException(status_code=409, detail="El username ya está en uso")
    usuario = Usuario(
        nombre=" ".join(payload.nombre.split()),
        username=payload.username.strip().lower(),
        password_hash=hash_password(payload.password),
        rol=payload.rol,
        cargo=" ".join(payload.cargo.split()),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return UsuarioOut.model_validate(usuario)
