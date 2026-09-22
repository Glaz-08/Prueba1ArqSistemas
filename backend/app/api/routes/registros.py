from datetime import date
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import HTMLResponse
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, selectinload
from starlette.responses import FileResponse

from app.core.config import settings
from app.core.database import get_db
from app.models.registro import (
    ElementoEncontrado,
    Evidencia,
    FuncionarioPresente,
    RegistroRevision,
)
from app.schemas.registro import (
    RegistroCreate,
    RegistroListado,
    RegistroOut,
    RegistroResumen,
)
from app.services.documento import documento_payload, render_documento_html

router = APIRouter()

TIPOS_IMAGEN = {"image/jpeg", "image/png", "image/webp"}
EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp"}
TAMANO_MAXIMO = 5 * 1024 * 1024


def _cargar_registro(db: Session, registro_id: str) -> RegistroRevision:
    registro = (
        db.query(RegistroRevision)
        .options(
            selectinload(RegistroRevision.funcionarios),
            selectinload(RegistroRevision.elementos),
            selectinload(RegistroRevision.evidencias),
        )
        .filter(RegistroRevision.id == registro_id)
        .first()
    )
    if registro is None:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return registro


def _patron_busqueda(valor: str) -> str:
    escapado = valor.translate({ord("\\"): "\\\\", ord("%"): "\\%", ord("_"): "\\_"})
    return f"%{escapado}%"


def _to_out(registro: RegistroRevision) -> RegistroOut:
    return RegistroOut(
        id=registro.id,
        estudiante={
            "rut": registro.estudiante_rut,
            "nombre": registro.estudiante_nombre,
            "curso": registro.estudiante_curso,
        },
        funcionarios_presentes=registro.funcionarios,
        motivo=registro.motivo,
        elementos_encontrados=registro.elementos,
        fecha=registro.fecha,
        hora_inicio=registro.hora_inicio,
        hora_termino=registro.hora_termino,
        evidencias=registro.evidencias,
        created_at=registro.created_at,
    )


@router.get("", response_model=RegistroListado)
def listar_registros(
    estudiante: str | None = Query(default=None, description="Nombre o RUT del estudiante"),
    curso: str | None = Query(default=None, description="Curso del estudiante"),
    motivo: str | None = Query(default=None, description="Texto contenido en el motivo"),
    fecha_desde: date | None = Query(default=None),
    fecha_hasta: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> RegistroListado:
    query = db.query(RegistroRevision)

    estudiante = estudiante.strip() if estudiante else None
    curso = curso.strip() if curso else None
    motivo = motivo.strip() if motivo else None

    condiciones = []
    if estudiante:
        patron = _patron_busqueda(estudiante)
        condiciones.append(
            or_(
                RegistroRevision.estudiante_nombre.ilike(patron, escape="\\"),
                RegistroRevision.estudiante_rut.ilike(patron, escape="\\"),
            )
        )
    if curso:
        condiciones.append(
            RegistroRevision.estudiante_curso.ilike(_patron_busqueda(curso), escape="\\")
        )
    if motivo:
        condiciones.append(RegistroRevision.motivo.ilike(_patron_busqueda(motivo), escape="\\"))
    if fecha_desde:
        condiciones.append(RegistroRevision.fecha >= fecha_desde)
    if fecha_hasta:
        condiciones.append(RegistroRevision.fecha <= fecha_hasta)

    if condiciones:
        query = query.filter(and_(*condiciones))

    registros = query.order_by(RegistroRevision.created_at.desc()).all()
    items = [
        RegistroResumen(
            id=item.id,
            estudiante_nombre=item.estudiante_nombre,
            estudiante_curso=item.estudiante_curso,
            motivo=item.motivo,
            fecha=item.fecha,
            hora_inicio=item.hora_inicio,
            hora_termino=item.hora_termino,
        )
        for item in registros
    ]
    return RegistroListado(items=items, total=len(items))


@router.post("", response_model=RegistroOut, status_code=201)
def crear_registro(payload: RegistroCreate, db: Session = Depends(get_db)) -> RegistroOut:
    registro = RegistroRevision(
        estudiante_rut=payload.estudiante.rut,
        estudiante_nombre=payload.estudiante.nombre,
        estudiante_curso=payload.estudiante.curso,
        motivo=payload.motivo,
        fecha=payload.fecha,
        hora_inicio=payload.hora_inicio,
        hora_termino=payload.hora_termino,
        funcionarios=[
            FuncionarioPresente(nombre=item.nombre, cargo=item.cargo)
            for item in payload.funcionarios_presentes
        ],
        elementos=[
            ElementoEncontrado(
                cantidad=item.cantidad,
                descripcion=item.descripcion,
                observaciones=item.observaciones,
            )
            for item in payload.elementos_encontrados
        ],
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return _to_out(_cargar_registro(db, registro.id))


@router.get("/{registro_id}", response_model=RegistroOut)
def obtener_registro(registro_id: str, db: Session = Depends(get_db)) -> RegistroOut:
    return _to_out(_cargar_registro(db, registro_id))


@router.post("/{registro_id}/evidencias", response_model=RegistroOut)
async def adjuntar_evidencia(
    registro_id: str,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> RegistroOut:
    registro = _cargar_registro(db, registro_id)
    nombre = archivo.filename or "evidencia"
    extension = Path(nombre).suffix.lower()
    content_type = archivo.content_type or ""

    if extension not in EXTENSIONES or content_type not in TIPOS_IMAGEN:
        raise HTTPException(
            status_code=400,
            detail="La evidencia debe ser una imagen JPG, PNG o WEBP",
        )

    contenido = await archivo.read()
    if not contenido:
        raise HTTPException(status_code=400, detail="El archivo de evidencia está vacío")
    if len(contenido) > TAMANO_MAXIMO:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB")

    directorio = Path(settings.upload_dir) / registro.id
    directorio.mkdir(parents=True, exist_ok=True)
    destino = directorio / f"{uuid4().hex}{extension}"
    destino.write_bytes(contenido)

    evidencia = Evidencia(
        registro_id=registro.id,
        nombre_archivo=Path(nombre).name,
        content_type=content_type,
        ruta=str(destino),
    )
    db.add(evidencia)
    db.commit()
    return _to_out(_cargar_registro(db, registro.id))


@router.get("/{registro_id}/evidencias/{evidencia_id}")
def obtener_evidencia(
    registro_id: str,
    evidencia_id: str,
    db: Session = Depends(get_db),
) -> FileResponse:
    registro = _cargar_registro(db, registro_id)
    evidencia = next((item for item in registro.evidencias if item.id == evidencia_id), None)
    if evidencia is None:
        raise HTTPException(status_code=404, detail="Evidencia no encontrada")
    ruta = Path(evidencia.ruta)
    if not ruta.exists():
        raise HTTPException(status_code=404, detail="Archivo de evidencia no encontrado")
    return FileResponse(ruta, media_type=evidencia.content_type, filename=evidencia.nombre_archivo)


@router.get("/{registro_id}/documento")
def obtener_documento(registro_id: str, db: Session = Depends(get_db)) -> dict:
    return documento_payload(_cargar_registro(db, registro_id))


@router.get("/{registro_id}/documento.html")
def descargar_documento_html(registro_id: str, db: Session = Depends(get_db)) -> HTMLResponse:
    registro = _cargar_registro(db, registro_id)
    html = render_documento_html(registro)
    headers = {
        "Content-Disposition": f'attachment; filename="copia-revision-{registro.id[:8]}.html"'
    }
    return HTMLResponse(content=html, headers=headers)
