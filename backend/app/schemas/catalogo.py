from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.registro import validar_rut


def _texto(value: str, minimo: int = 2) -> str:
    limpio = " ".join(value.split())
    if len(limpio) < minimo:
        raise ValueError("El campo no puede estar vacío")
    return limpio


class EstudianteIn(BaseModel):
    rut: str = Field(min_length=8, max_length=20)
    nombre: str = Field(min_length=3, max_length=200)
    curso: str = Field(min_length=1, max_length=50)

    @field_validator("rut")
    @classmethod
    def rut_chileno(cls, value: str) -> str:
        return validar_rut(value)

    @field_validator("nombre", "curso")
    @classmethod
    def texto_limpio(cls, value: str) -> str:
        return _texto(value)


class FuncionarioIn(BaseModel):
    rut: str = Field(min_length=8, max_length=20)
    nombre: str = Field(min_length=3, max_length=200)
    cargo: str = Field(min_length=2, max_length=120)

    @field_validator("rut")
    @classmethod
    def rut_chileno(cls, value: str) -> str:
        return validar_rut(value)

    @field_validator("nombre", "cargo")
    @classmethod
    def texto_limpio(cls, value: str) -> str:
        return _texto(value)


class EstudianteOut(BaseModel):
    id: str
    rut: str
    nombre: str
    curso: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FuncionarioOut(BaseModel):
    id: str
    rut: str
    nombre: str
    cargo: str
    created_at: datetime

    model_config = {"from_attributes": True}
