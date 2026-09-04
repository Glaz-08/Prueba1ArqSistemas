from fastapi import APIRouter

from app.api.routes import health, registros

api_router = APIRouter()
api_router.include_router(health.router, tags=["salud"])
api_router.include_router(registros.router, prefix="/registros", tags=["registros"])
