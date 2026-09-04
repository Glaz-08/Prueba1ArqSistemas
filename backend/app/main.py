from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    description=(
        "API REST para la gestión de registros de revisión de pertenencias "
        "en establecimientos educacionales, conforme a la Ley 21.827."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/")
def root() -> dict:
    return {
        "mensaje": settings.app_name,
        "documentacion": "/docs",
        "api": settings.api_prefix,
    }
