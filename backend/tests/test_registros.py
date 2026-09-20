from fastapi.testclient import TestClient

PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


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


def test_crear_registro_completo(client: TestClient) -> None:
    data = crear_registro(client)

    assert data["estudiante"]["rut"] == "11.111.111-1"
    assert data["estudiante"]["nombre"] == "Camila Soto"
    assert len(data["funcionarios_presentes"]) == 2
    assert data["elementos_encontrados"][0]["cantidad"] == 1
    assert data["hora_inicio"] == "10:15:00"
    assert data["evidencias"] == []


def test_listar_registros_despues_de_crear(client: TestClient) -> None:
    creado = crear_registro(client)
    response = client.get("/api/registros")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == creado["id"]
    assert body["items"][0]["estudiante_nombre"] == "Camila Soto"


def test_obtener_registro_por_id(client: TestClient) -> None:
    creado = crear_registro(client)
    response = client.get(f"/api/registros/{creado['id']}")

    assert response.status_code == 200
    assert response.json()["motivo"].startswith("Denuncia")


def test_registro_inexistente(client: TestClient) -> None:
    response = client.get("/api/registros/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_crear_sin_funcionarios(client: TestClient) -> None:
    response = client.post(
        "/api/registros",
        json=payload_valido(funcionarios_presentes=[]),
    )
    assert response.status_code == 422


def test_crear_hora_termino_invalida(client: TestClient) -> None:
    response = client.post(
        "/api/registros",
        json=payload_valido(hora_inicio="11:00", hora_termino="10:00"),
    )
    assert response.status_code == 422


def test_crear_rut_invalido(client: TestClient) -> None:
    response = client.post(
        "/api/registros",
        json=payload_valido(
            estudiante={"rut": "11.111.111-9", "nombre": "Camila Soto", "curso": "2° medio A"}
        ),
    )
    assert response.status_code == 422


def test_adjuntar_evidencia_y_descargarla(client: TestClient) -> None:
    creado = crear_registro(client)
    upload = client.post(
        f"/api/registros/{creado['id']}/evidencias",
        files={"archivo": ("mochila.png", PNG_1X1, "image/png")},
    )

    assert upload.status_code == 200, upload.text
    evidencias = upload.json()["evidencias"]
    assert len(evidencias) == 1

    descarga = client.get(
        f"/api/registros/{creado['id']}/evidencias/{evidencias[0]['id']}"
    )
    assert descarga.status_code == 200
    assert descarga.content.startswith(b"\x89PNG")


def test_rechazar_evidencia_no_imagen(client: TestClient) -> None:
    creado = crear_registro(client)
    response = client.post(
        f"/api/registros/{creado['id']}/evidencias",
        files={"archivo": ("nota.txt", b"hola", "text/plain")},
    )
    assert response.status_code == 400


def test_documento_json(client: TestClient) -> None:
    creado = crear_registro(client)
    response = client.get(f"/api/registros/{creado['id']}/documento")

    assert response.status_code == 200
    body = response.json()
    assert body["norma"] == "Ley 21.827"
    assert body["estudiante"]["nombre"] == "Camila Soto"
    assert body["tiene_evidencia_fotografica"] is False


def test_documento_html_descargable(client: TestClient) -> None:
    creado = crear_registro(client, elementos_encontrados=[])
    response = client.get(f"/api/registros/{creado['id']}/documento.html")

    assert response.status_code == 200
    assert "attachment" in response.headers["content-disposition"]
    assert "Camila Soto" in response.text
    assert "No se registraron elementos encontrados" in response.text
    assert "Ley 21.827" in response.text


def test_documento_html_con_elementos(client: TestClient) -> None:
    creado = crear_registro(client)
    response = client.get(f"/api/registros/{creado['id']}/documento.html")

    assert response.status_code == 200
    assert "Encendedor" in response.text
    assert "Observaciones" in response.text
