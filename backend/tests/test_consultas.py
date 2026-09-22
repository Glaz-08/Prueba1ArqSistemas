from fastapi.testclient import TestClient

from conftest import crear_registro


def test_listar_sin_filtros_devuelve_todo(client: TestClient) -> None:
    crear_registro(client)
    crear_registro(client, estudiante={"rut": "22.222.222-2", "nombre": "Diego Pino", "curso": "3° medio B"})

    response = client.get("/api/registros")

    assert response.status_code == 200
    assert response.json()["total"] == 2


def test_filtrar_por_nombre_parcial(client: TestClient) -> None:
    crear_registro(client)
    crear_registro(client, estudiante={"rut": "22.222.222-2", "nombre": "Diego Pino", "curso": "3° medio B"})

    response = client.get("/api/registros", params={"estudiante": "camila"})

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["estudiante_nombre"] == "Camila Soto"


def test_filtrar_por_rut_parcial(client: TestClient) -> None:
    crear_registro(client)
    crear_registro(client, estudiante={"rut": "22.222.222-2", "nombre": "Diego Pino", "curso": "3° medio B"})

    response = client.get("/api/registros", params={"estudiante": "22.222.222"})

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["estudiante_nombre"] == "Diego Pino"


def test_filtrar_por_curso_parcial(client: TestClient) -> None:
    crear_registro(client)
    crear_registro(client, estudiante={"rut": "22.222.222-2", "nombre": "Diego Pino", "curso": "3° medio B"})

    response = client.get("/api/registros", params={"curso": "3° medio"})

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["estudiante_nombre"] == "Diego Pino"


def test_filtrar_por_motivo_parcial(client: TestClient) -> None:
    crear_registro(client, motivo="Denuncia de posible porte de objeto prohibido")
    crear_registro(
        client,
        estudiante={"rut": "22.222.222-2", "nombre": "Diego Pino", "curso": "3° medio B"},
        motivo="Sospecha de sustancia no permitida en mochila",
    )

    response = client.get("/api/registros", params={"motivo": "sustancia"})

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["estudiante_nombre"] == "Diego Pino"


def test_filtrar_por_rango_de_fechas(client: TestClient) -> None:
    crear_registro(client, fecha="2026-01-10")
    crear_registro(
        client,
        estudiante={"rut": "22.222.222-2", "nombre": "Diego Pino", "curso": "3° medio B"},
        fecha="2026-09-20",
    )

    response = client.get(
        "/api/registros",
        params={"fecha_desde": "2026-09-01", "fecha_hasta": "2026-09-30"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["estudiante_nombre"] == "Diego Pino"


def test_combinar_filtros(client: TestClient) -> None:
    crear_registro(client, fecha="2026-09-20", motivo="Denuncia de posible porte de objeto prohibido")
    crear_registro(client, fecha="2026-09-21", motivo="Otro motivo distinto para descartar")

    response = client.get(
        "/api/registros",
        params={"estudiante": "camila", "motivo": "denuncia", "fecha_desde": "2026-09-20", "fecha_hasta": "2026-09-20"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1


def test_filtrar_con_comodin_sql_no_devuelve_todo(client: TestClient) -> None:
    crear_registro(client)
    crear_registro(client, estudiante={"rut": "22.222.222-2", "nombre": "Diego Pino", "curso": "3° medio B"})

    response = client.get("/api/registros", params={"motivo": "%"})

    assert response.status_code == 200
    assert response.json()["total"] == 0

    response_guion_bajo = client.get("/api/registros", params={"estudiante": "_"})

    assert response_guion_bajo.status_code == 200
    assert response_guion_bajo.json()["total"] == 0


def test_filtro_de_solo_espacios_se_trata_como_vacio(client: TestClient) -> None:
    crear_registro(client)
    crear_registro(client, estudiante={"rut": "22.222.222-2", "nombre": "Diego Pino", "curso": "3° medio B"})

    response = client.get("/api/registros", params={"estudiante": "   "})

    assert response.status_code == 200
    assert response.json()["total"] == 2


def test_filtro_sin_coincidencias_devuelve_lista_vacia(client: TestClient) -> None:
    crear_registro(client)

    response = client.get("/api/registros", params={"estudiante": "nadie con este nombre"})

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["items"] == []
