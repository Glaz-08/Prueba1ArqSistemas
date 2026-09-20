from datetime import date, datetime, time, timezone
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid4())


class RegistroRevision(Base):
    __tablename__ = "registros_revision"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    estudiante_rut: Mapped[str] = mapped_column(String(20))
    estudiante_nombre: Mapped[str] = mapped_column(String(200))
    estudiante_curso: Mapped[str] = mapped_column(String(50))
    motivo: Mapped[str] = mapped_column(Text)
    fecha: Mapped[date] = mapped_column(Date)
    hora_inicio: Mapped[time] = mapped_column(Time)
    hora_termino: Mapped[time] = mapped_column(Time)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    funcionarios: Mapped[list["FuncionarioPresente"]] = relationship(
        back_populates="registro",
        cascade="all, delete-orphan",
    )
    elementos: Mapped[list["ElementoEncontrado"]] = relationship(
        back_populates="registro",
        cascade="all, delete-orphan",
    )
    evidencias: Mapped[list["Evidencia"]] = relationship(
        back_populates="registro",
        cascade="all, delete-orphan",
    )


class FuncionarioPresente(Base):
    __tablename__ = "funcionarios_presentes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    registro_id: Mapped[str] = mapped_column(ForeignKey("registros_revision.id"))
    nombre: Mapped[str] = mapped_column(String(200))
    cargo: Mapped[str] = mapped_column(String(120))

    registro: Mapped[RegistroRevision] = relationship(back_populates="funcionarios")


class ElementoEncontrado(Base):
    __tablename__ = "elementos_encontrados"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    registro_id: Mapped[str] = mapped_column(ForeignKey("registros_revision.id"))
    cantidad: Mapped[int] = mapped_column(Integer)
    descripcion: Mapped[str] = mapped_column(String(300))
    observaciones: Mapped[str] = mapped_column(Text, default="")

    registro: Mapped[RegistroRevision] = relationship(back_populates="elementos")


class Evidencia(Base):
    __tablename__ = "evidencias"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    registro_id: Mapped[str] = mapped_column(ForeignKey("registros_revision.id"))
    nombre_archivo: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    ruta: Mapped[str] = mapped_column(String(500))

    registro: Mapped[RegistroRevision] = relationship(back_populates="evidencias")
