from fastapi.testclient import TestClient

from conftest import _iniciar_sesion


def test_login_ok(client_sin_auth: TestClient) -> None:
    response = client_sin_auth.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["usuario"]["username"] == "admin"
    assert body["usuario"]["rol"] == "admin"


def test_login_contrasena_incorrecta(client_sin_auth: TestClient) -> None:
    response = client_sin_auth.post(
        "/api/auth/login",
        json={"username": "admin", "password": "incorrecta"},
    )

    assert response.status_code == 401


def test_login_usuario_inexistente(client_sin_auth: TestClient) -> None:
    response = client_sin_auth.post(
        "/api/auth/login",
        json={"username": "nadie", "password": "cualquiera1"},
    )

    assert response.status_code == 401


def test_me_con_sesion(client: TestClient) -> None:
    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["username"] == "funcionario"
    assert response.json()["rol"] == "funcionario"


def test_logout_con_sesion(client: TestClient) -> None:
    response = client.post("/api/auth/logout")

    assert response.status_code == 200
    assert response.json()["mensaje"] == "Sesión cerrada"


def test_ruta_protegida_sin_token(client_sin_auth: TestClient) -> None:
    assert client_sin_auth.get("/api/registros").status_code == 401
    assert client_sin_auth.get("/api/estadisticas").status_code == 401
    assert client_sin_auth.post("/api/registros", json={}).status_code == 401


def test_crear_usuario_solo_admin(client_sin_auth: TestClient) -> None:
    payload = {
        "nombre": "Nueva Docente",
        "username": "docente1",
        "password": "secreto123",
        "rol": "funcionario",
    }

    token_func = _iniciar_sesion(client_sin_auth, "funcionario", "funcionario123")
    client_sin_auth.headers["Authorization"] = f"Bearer {token_func}"
    prohibido = client_sin_auth.post("/api/auth/usuarios", json=payload)
    assert prohibido.status_code == 403

    token_admin = _iniciar_sesion(client_sin_auth, "admin", "admin123")
    client_sin_auth.headers["Authorization"] = f"Bearer {token_admin}"
    creado = client_sin_auth.post("/api/auth/usuarios", json=payload)
    assert creado.status_code == 201, creado.text
    assert creado.json()["username"] == "docente1"

    duplicado = client_sin_auth.post("/api/auth/usuarios", json=payload)
    assert duplicado.status_code == 409
