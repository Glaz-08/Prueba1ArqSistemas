from datetime import date, datetime, time

from pydantic import BaseModel, Field, field_validator, model_validator


def validar_rut(rut: str) -> str:
    limpio = rut.replace(".", "").replace(" ", "").upper()
    if "-" in limpio:
        cuerpo, dv = limpio.split("-", 1)
    elif len(limpio) >= 8:
        cuerpo, dv = limpio[:-1], limpio[-1]
    else:
        raise ValueError("El RUT del estudiante no es válido")

    if not cuerpo.isdigit() or len(cuerpo) < 7 or len(dv) != 1:
        raise ValueError("El RUT del estudiante no es válido")

    factores = [2, 3, 4, 5, 6, 7]
    total = 0
    for indice, digito in enumerate(reversed(cuerpo)):
        total += int(digito) * factores[indice % 6]
    resto = 11 - (total % 11)
    esperado = "0" if resto == 11 else "K" if resto == 10 else str(resto)
    if dv != esperado:
        raise ValueError("El RUT del estudiante no es válido")

    cuerpo_formateado = f"{int(cuerpo):,}".replace(",", ".")
    return f"{cuerpo_formateado}-{dv}"


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
        limpio = " ".join(value.split())
        if not limpio:
            raise ValueError("El campo no puede estar vacío")
        return limpio


class FuncionarioIn(BaseModel):
    nombre: str = Field(min_length=3, max_length=200)
    cargo: str = Field(min_length=2, max_length=120)

    @field_validator("nombre", "cargo")
    @classmethod
    def texto_limpio(cls, value: str) -> str:
        limpio = " ".join(value.split())
        if not limpio:
            raise ValueError("El campo no puede estar vacío")
        return limpio


class ElementoIn(BaseModel):
    cantidad: int = Field(ge=1, le=999)
    descripcion: str = Field(min_length=2, max_length=300)
    observaciones: str = Field(default="", max_length=500)

    @field_validator("descripcion", "observaciones")
    @classmethod
    def texto_limpio(cls, value: str) -> str:
        return " ".join(value.split())


class RegistroCreate(BaseModel):
    estudiante: EstudianteIn
    funcionarios_presentes: list[FuncionarioIn] = Field(min_length=1)
    motivo: str = Field(min_length=5, max_length=1000)
    elementos_encontrados: list[ElementoIn] = Field(default_factory=list)
    fecha: date
    hora_inicio: time
    hora_termino: time

    @field_validator("motivo")
    @classmethod
    def motivo_limpio(cls, value: str) -> str:
        limpio = " ".join(value.split())
        if len(limpio) < 5:
            raise ValueError("El motivo debe tener al menos 5 caracteres")
        return limpio

    @model_validator(mode="after")
    def horarios_coherentes(self) -> "RegistroCreate":
        if self.hora_termino <= self.hora_inicio:
            raise ValueError("La hora de término debe ser posterior a la de inicio")
        return self


class EstudianteOut(BaseModel):
    rut: str
    nombre: str
    curso: str


class FuncionarioOut(BaseModel):
    id: str
    nombre: str
    cargo: str

    model_config = {"from_attributes": True}


class ElementoOut(BaseModel):
    id: str
    cantidad: int
    descripcion: str
    observaciones: str

    model_config = {"from_attributes": True}


class EvidenciaOut(BaseModel):
    id: str
    nombre_archivo: str
    content_type: str

    model_config = {"from_attributes": True}


class RegistroOut(BaseModel):
    id: str
    estudiante: EstudianteOut
    funcionarios_presentes: list[FuncionarioOut]
    motivo: str
    elementos_encontrados: list[ElementoOut]
    fecha: date
    hora_inicio: time
    hora_termino: time
    evidencias: list[EvidenciaOut]
    created_at: datetime


class RegistroResumen(BaseModel):
    id: str
    estudiante_nombre: str
    estudiante_curso: str
    motivo: str
    fecha: date
    hora_inicio: time
    hora_termino: time


class RegistroListado(BaseModel):
    items: list[RegistroResumen]
    total: int
