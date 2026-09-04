from fastapi import APIRouter

from app.core.config import settings
from app.schemas.health import HealthResponse, StackInfo

router = APIRouter()


@router.get("/salud", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        environment=settings.app_env,
        stack=StackInfo(
            backend="Python + FastAPI",
            frontend="React + TypeScript",
            api="REST",
        ),
    )
