from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.catalogo import Estudiante, Funcionario
from app.schemas.catalogo import (
    EstudianteIn,
    EstudianteOut,
    FuncionarioIn,
    FuncionarioOut,
)

router = APIRouter(dependencies=[Depends(get_current_user)])


def _patron(valor: str) -> str:
    escapado = valor.translate({ord("\\"): "\\\\", ord("%"): "\\%", ord("_"): "\\_"})
    return f"%{escapado}%"


def _obtener(db: Session, modelo, item_id: str, etiqueta: str):
    item = db.query(modelo).filter(modelo.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail=f"{etiqueta} no encontrado")
    return item


@router.get("/estudiantes", response_model=list[EstudianteOut])
def listar_estudiantes(
    q: str | None = Query(default=None, description="Nombre, RUT o curso"),
    db: Session = Depends(get_db),
) -> list[EstudianteOut]:
    query = db.query(Estudiante)
    if q and q.strip():
        patron = _patron(q.strip())
        query = query.filter(
            or_(
                Estudiante.nombre.ilike(patron, escape="\\"),
                Estudiante.rut.ilike(patron, escape="\\"),
                Estudiante.curso.ilike(patron, escape="\\"),
            )
        )
    return [EstudianteOut.model_validate(i) for i in query.order_by(Estudiante.nombre).all()]


@router.post("/estudiantes", response_model=EstudianteOut, status_code=201)
def crear_estudiante(payload: EstudianteIn, db: Session = Depends(get_db)) -> EstudianteOut:
    if db.query(Estudiante).filter(Estudiante.rut == payload.rut).first():
        raise HTTPException(status_code=409, detail="Ya existe un estudiante con ese RUT")
    item = Estudiante(rut=payload.rut, nombre=payload.nombre, curso=payload.curso)
    db.add(item)
    db.commit()
    db.refresh(item)
    return EstudianteOut.model_validate(item)


@router.put("/estudiantes/{item_id}", response_model=EstudianteOut)
def actualizar_estudiante(
    item_id: str, payload: EstudianteIn, db: Session = Depends(get_db)
) -> EstudianteOut:
    item = _obtener(db, Estudiante, item_id, "Estudiante")
    duplicado = (
        db.query(Estudiante).filter(Estudiante.rut == payload.rut, Estudiante.id != item_id).first()
    )
    if duplicado:
        raise HTTPException(status_code=409, detail="Ya existe un estudiante con ese RUT")
    item.rut = payload.rut
    item.nombre = payload.nombre
    item.curso = payload.curso
    db.commit()
    db.refresh(item)
    return EstudianteOut.model_validate(item)


@router.delete("/estudiantes/{item_id}", status_code=204)
def eliminar_estudiante(item_id: str, db: Session = Depends(get_db)) -> None:
    item = _obtener(db, Estudiante, item_id, "Estudiante")
    db.delete(item)
    db.commit()


@router.get("/funcionarios", response_model=list[FuncionarioOut])
def listar_funcionarios(
    q: str | None = Query(default=None, description="Nombre, RUT o cargo"),
    db: Session = Depends(get_db),
) -> list[FuncionarioOut]:
    query = db.query(Funcionario)
    if q and q.strip():
        patron = _patron(q.strip())
        query = query.filter(
            or_(
                Funcionario.nombre.ilike(patron, escape="\\"),
                Funcionario.rut.ilike(patron, escape="\\"),
                Funcionario.cargo.ilike(patron, escape="\\"),
            )
        )
    return [FuncionarioOut.model_validate(i) for i in query.order_by(Funcionario.nombre).all()]


@router.post("/funcionarios", response_model=FuncionarioOut, status_code=201)
def crear_funcionario(payload: FuncionarioIn, db: Session = Depends(get_db)) -> FuncionarioOut:
    if db.query(Funcionario).filter(Funcionario.rut == payload.rut).first():
        raise HTTPException(status_code=409, detail="Ya existe un funcionario con ese RUT")
    item = Funcionario(rut=payload.rut, nombre=payload.nombre, cargo=payload.cargo)
    db.add(item)
    db.commit()
    db.refresh(item)
    return FuncionarioOut.model_validate(item)


@router.put("/funcionarios/{item_id}", response_model=FuncionarioOut)
def actualizar_funcionario(
    item_id: str, payload: FuncionarioIn, db: Session = Depends(get_db)
) -> FuncionarioOut:
    item = _obtener(db, Funcionario, item_id, "Funcionario")
    duplicado = (
        db.query(Funcionario).filter(Funcionario.rut == payload.rut, Funcionario.id != item_id).first()
    )
    if duplicado:
        raise HTTPException(status_code=409, detail="Ya existe un funcionario con ese RUT")
    item.rut = payload.rut
    item.nombre = payload.nombre
    item.cargo = payload.cargo
    db.commit()
    db.refresh(item)
    return FuncionarioOut.model_validate(item)


@router.delete("/funcionarios/{item_id}", status_code=204)
def eliminar_funcionario(item_id: str, db: Session = Depends(get_db)) -> None:
    item = _obtener(db, Funcionario, item_id, "Funcionario")
    db.delete(item)
    db.commit()
