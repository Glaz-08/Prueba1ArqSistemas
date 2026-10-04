from fastapi import APIRouter, Depends

from app.api.routes import auth, catalogos, estadisticas, health, registros
from app.core.security import get_current_user

api_router = APIRouter()
api_router.include_router(health.router, tags=["salud"])
api_router.include_router(auth.router, prefix="/auth", tags=["autenticación"])
api_router.include_router(catalogos.router, tags=["catálogos"])
api_router.include_router(
    registros.router,
    prefix="/registros",
    tags=["registros"],
    dependencies=[Depends(get_current_user)],
)
api_router.include_router(
    estadisticas.router,
    prefix="/estadisticas",
    tags=["estadisticas"],
    dependencies=[Depends(get_current_user)],
)
