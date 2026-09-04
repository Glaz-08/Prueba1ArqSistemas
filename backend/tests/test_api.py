from fastapi.testclient import TestClient

from app.core.config import Settings
from app.schemas import HealthResponse, StackInfo


def test_root(client: TestClient) -> None:
    response = client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert data["mensaje"] == "Registro de Revisiones"
    assert data["documentacion"] == "/docs"
    assert data["api"] == "/api"


def test_salud(client: TestClient) -> None:
    response = client.get("/api/salud")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Registro de Revisiones"
    assert data["environment"] == "development"
    assert data["stack"] == {
        "backend": "Python + FastAPI",
        "frontend": "React + TypeScript",
        "api": "REST",
    }


def test_listar_registros_vacio(client: TestClient) -> None:
    response = client.get("/api/registros")

    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_documentacion_openapi(client: TestClient) -> None:
    docs = client.get("/docs")
    openapi = client.get("/openapi.json")

    assert docs.status_code == 200
    assert openapi.status_code == 200
    assert openapi.json()["info"]["title"] == "Registro de Revisiones"


def test_cors_permite_frontend(client: TestClient) -> None:
    response = client.options(
        "/api/salud",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_settings_por_defecto() -> None:
    settings = Settings()

    assert settings.app_name == "Registro de Revisiones"
    assert settings.api_prefix == "/api"
    assert settings.frontend_origin == "http://localhost:5173"


def test_schemas_exportados() -> None:
    stack = StackInfo(backend="Python + FastAPI", frontend="React + TypeScript", api="REST")
    health = HealthResponse(
        status="ok",
        service="Registro de Revisiones",
        environment="development",
        stack=stack,
    )

    assert health.status == "ok"
    assert health.stack.api == "REST"
