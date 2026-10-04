from fastapi.testclient import TestClient

ESTUDIANTE = {"rut": "11.111.111-1", "nombre": "Camila Soto", "curso": "2° medio A"}
FUNCIONARIO = {"rut": "22.222.222-2", "nombre": "Pedro Núñez", "cargo": "Inspector general"}


def test_crear_y_listar_estudiante(client: TestClient) -> None:
    creado = client.post("/api/estudiantes", json=ESTUDIANTE)
    assert creado.status_code == 201, creado.text
    assert creado.json()["rut"] == "11.111.111-1"

    listado = client.get("/api/estudiantes")
    assert listado.status_code == 200
    assert len(listado.json()) == 1


def test_buscar_estudiante(client: TestClient) -> None:
    client.post("/api/estudiantes", json=ESTUDIANTE)
    client.post(
        "/api/estudiantes",
        json={"rut": "13.333.333-9", "nombre": "Elena Ruiz", "curso": "3° medio B"},
    )

    resultado = client.get("/api/estudiantes", params={"q": "elena"})
    assert resultado.status_code == 200
    assert [item["nombre"] for item in resultado.json()] == ["Elena Ruiz"]


def test_editar_estudiante(client: TestClient) -> None:
    creado = client.post("/api/estudiantes", json=ESTUDIANTE).json()

    editado = client.put(
        f"/api/estudiantes/{creado['id']}",
        json={**ESTUDIANTE, "curso": "3° medio A"},
    )
    assert editado.status_code == 200
    assert editado.json()["curso"] == "3° medio A"


def test_eliminar_estudiante(client: TestClient) -> None:
    creado = client.post("/api/estudiantes", json=ESTUDIANTE).json()

    borrado = client.delete(f"/api/estudiantes/{creado['id']}")
    assert borrado.status_code == 204
    assert client.get("/api/estudiantes").json() == []


def test_rut_duplicado_rechazado(client: TestClient) -> None:
    assert client.post("/api/estudiantes", json=ESTUDIANTE).status_code == 201
    duplicado = client.post("/api/estudiantes", json=ESTUDIANTE)
    assert duplicado.status_code == 409


def test_rut_invalido_rechazado(client: TestClient) -> None:
    invalido = client.post("/api/estudiantes", json={**ESTUDIANTE, "rut": "11.111.111-9"})
    assert invalido.status_code == 422


def test_catalogos_requieren_sesion(client_sin_auth: TestClient) -> None:
    assert client_sin_auth.get("/api/estudiantes").status_code == 401
    assert client_sin_auth.get("/api/funcionarios").status_code == 401


def test_crear_editar_eliminar_funcionario(client: TestClient) -> None:
    creado = client.post("/api/funcionarios", json=FUNCIONARIO)
    assert creado.status_code == 201, creado.text
    item = creado.json()

    editado = client.put(
        f"/api/funcionarios/{item['id']}",
        json={**FUNCIONARIO, "cargo": "Inspector de patio"},
    )
    assert editado.status_code == 200
    assert editado.json()["cargo"] == "Inspector de patio"

    buscado = client.get("/api/funcionarios", params={"q": "patio"})
    assert [f["nombre"] for f in buscado.json()] == ["Pedro Núñez"]

    assert client.delete(f"/api/funcionarios/{item['id']}").status_code == 204
    assert client.get("/api/funcionarios").json() == []
