from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch) -> Generator[TestClient, None, None]:
    monkeypatch.setattr("app.core.config.settings.upload_dir", str(tmp_path))

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def payload_valido(**overrides: object) -> dict:
    data = {
        "estudiante": {
            "rut": "11.111.111-1",
            "nombre": "Camila Soto",
            "curso": "2° medio A",
        },
        "funcionarios_presentes": [
            {"nombre": "Pedro Núñez", "cargo": "Inspector general"},
            {"nombre": "Ana Reyes", "cargo": "Orientadora"},
        ],
        "motivo": "Denuncia de posible porte de objeto prohibido",
        "elementos_encontrados": [
            {
                "cantidad": 1,
                "descripcion": "Encendedor",
                "observaciones": "En el bolsillo exterior de la mochila",
            }
        ],
        "fecha": "2026-09-20",
        "hora_inicio": "10:15",
        "hora_termino": "10:32",
    }
    data.update(overrides)
    return data


def crear_registro(client: TestClient, **overrides: object) -> dict:
    response = client.post("/api/registros", json=payload_valido(**overrides))
    assert response.status_code == 201, response.text
    return response.json()
