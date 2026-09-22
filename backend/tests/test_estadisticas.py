from fastapi.testclient import TestClient

from conftest import crear_registro


def test_estadisticas_sin_registros(client: TestClient) -> None:
    response = client.get("/api/estadisticas")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["por_mes"] == []
    assert body["por_motivo"] == []
    assert body["por_curso"] == []


def test_estadisticas_total_y_agrupaciones(client: TestClient) -> None:
    crear_registro(
        client,
        estudiante={"rut": "11.111.111-1", "nombre": "Camila Soto", "curso": "2° medio A"},
        motivo="Denuncia de posible porte de objeto prohibido",
        fecha="2026-08-05",
    )
    crear_registro(
        client,
        estudiante={"rut": "22.222.222-2", "nombre": "Diego Pino", "curso": "2° medio A"},
        motivo="Denuncia de posible porte de objeto prohibido",
        fecha="2026-08-20",
    )
    crear_registro(
        client,
        estudiante={"rut": "33.333.333-3", "nombre": "Elena Ruiz", "curso": "3° medio B"},
        motivo="Sospecha de sustancia no permitida",
        fecha="2026-09-02",
    )

    response = client.get("/api/estadisticas")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3

    por_mes = {item["nombre"]: item["cantidad"] for item in body["por_mes"]}
    assert por_mes == {"2026-08": 2, "2026-09": 1}
    assert [item["nombre"] for item in body["por_mes"]] == ["2026-08", "2026-09"]

    assert body["por_motivo"][0] == {
        "nombre": "Denuncia de posible porte de objeto prohibido",
        "cantidad": 2,
    }
    assert body["por_motivo"][1] == {
        "nombre": "Sospecha de sustancia no permitida",
        "cantidad": 1,
    }

    por_curso = {item["nombre"]: item["cantidad"] for item in body["por_curso"]}
    assert por_curso == {"2° medio A": 2, "3° medio B": 1}
    assert body["por_curso"][0]["nombre"] == "2° medio A"


def test_estadisticas_orden_descendente_por_cantidad(client: TestClient) -> None:
    for curso in ("1° básico A", "1° básico A", "1° básico A", "2° básico B", "2° básico B"):
        crear_registro(
            client,
            estudiante={"rut": "11.111.111-1", "nombre": "Camila Soto", "curso": curso},
        )

    response = client.get("/api/estadisticas")

    assert response.status_code == 200
    por_curso = response.json()["por_curso"]
    assert por_curso[0] == {"nombre": "1° básico A", "cantidad": 3}
    assert por_curso[1] == {"nombre": "2° básico B", "cantidad": 2}
