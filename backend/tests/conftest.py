from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models.usuario import Usuario


def _crear_suarios(engine) -> None:
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = Session()
    try:
        db.add_all(
            [
                Usuario(
                    nombre="Admin de prueba",
                    username="admin",
                    password_hash=hash_password("admin123"),
                    rol="admin",
                    cargo="Administrador",
                ),
                Usuario(
                    nombre="Laura Fuentes",
                    username="funcionario",
                    password_hash=hash_password("funcionario123"),
                    rol="funcionario",
                    cargo="Inspectora",
                ),
            ]
        )
        db.commit()
    finally:
        db.close()


def _iniciar_sesion(client: TestClient, username: str = "funcionario", password: str = "funcionario123") -> str:
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


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
    _crear_suarios(engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        token = _iniciar_sesion(test_client)
        test_client.headers["Authorization"] = f"Bearer {token}"
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client_sin_auth(tmp_path, monkeypatch) -> Generator[TestClient, None, None]:
    monkeypatch.setattr("app.core.config.settings.upload_dir", str(tmp_path))

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    _crear_suarios(engine)

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
            {"rut": "22.222.222-2", "nombre": "Pedro Núñez", "cargo": "Inspector general"},
            {"rut": "12.345.678-5", "nombre": "Ana Reyes", "cargo": "Orientadora"},
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


def asegurar_estudiante(client: TestClient, estudiante: dict) -> None:
    respuesta = client.post("/api/estudiantes", json=estudiante)
    assert respuesta.status_code in (201, 409), respuesta.text


def asegurar_funcionario(client: TestClient, funcionario: dict) -> None:
    respuesta = client.post("/api/funcionarios", json=funcionario)
    assert respuesta.status_code in (201, 409), respuesta.text


def crear_registro(client: TestClient, **overrides: object) -> dict:
    payload = payload_valido(**overrides)
    asegurar_estudiante(client, payload["estudiante"])
    for presente in payload["funcionarios_presentes"]:
        asegurar_funcionario(client, presente)
    response = client.post("/api/registros", json=payload)
    assert response.status_code == 201, response.text
    return response.json()
