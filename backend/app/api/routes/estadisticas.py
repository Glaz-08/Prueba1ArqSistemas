from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.estadisticas import EstadisticasOut
from app.services.estadisticas import calcular_estadisticas

router = APIRouter()


@router.get("", response_model=EstadisticasOut)
def obtener_estadisticas(db: Session = Depends(get_db)) -> EstadisticasOut:
    return calcular_estadisticas(db)
