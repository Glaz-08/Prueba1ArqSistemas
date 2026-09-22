from pydantic import BaseModel


class ConteoItem(BaseModel):
    nombre: str
    cantidad: int


class EstadisticasOut(BaseModel):
    total: int
    por_mes: list[ConteoItem]
    por_motivo: list[ConteoItem]
    por_curso: list[ConteoItem]
