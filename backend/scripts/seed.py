"""Carga registros de ejemplo en la API para poder probar Consulta y Estadísticas.

Uso (con el backend corriendo, por defecto en http://127.0.0.1:8000):

    .venv\\Scripts\\python.exe scripts\\seed.py

Cada ejecución crea registros nuevos (no revisa duplicados), así que puedes
correrlo varias veces si quieres más datos.
"""

import os
import random
from datetime import date, timedelta

import httpx

API_URL = os.environ.get("API_URL", "http://127.0.0.1:8000/api")
SEED_USER = os.environ.get("SEED_USER", "funcionario")
SEED_PASSWORD = os.environ.get("SEED_PASSWORD", "funcionario123")

ESTUDIANTES = [
    ("11111111", "Camila Soto", "2° medio A"),
    ("12222222", "Diego Pino", "3° medio B"),
    ("13333333", "Elena Ruiz", "2° medio A"),
    ("14444444", "Martín Reyes", "1° medio C"),
    ("15555555", "Valentina Cruz", "4° medio A"),
    ("16666666", "Joaquín Vidal", "3° medio B"),
    ("17777777", "Fernanda Soto", "1° medio C"),
]

MOTIVOS = [
    "Denuncia de posible porte de objeto prohibido",
    "Sospecha de sustancia no permitida en mochila",
    "Solicitud de apoderado por seguridad",
    "Protocolo interno de convivencia escolar",
    "Denuncia anónima de porte de arma blanca",
]

FUNCIONARIOS = [
    ("21111111", "Pedro Núñez", "Inspector general"),
    ("22222222", "Ana Reyes", "Orientador/a de convivencia"),
    ("23333333", "Laura Fuentes", "Docente"),
    ("24444444", "Jorge Salinas", "Inspector de patio"),
    ("25555555", "Marcela Vega", "Directivo"),
]

ELEMENTOS = [
    [],
    [{"cantidad": 1, "descripcion": "Encendedor", "observaciones": "En el bolsillo exterior"}],
    [{"cantidad": 2, "descripcion": "Cigarrillos", "observaciones": ""}],
    [
        {"cantidad": 1, "descripcion": "Cuchillo cartonero", "observaciones": "Dentro del estuche"},
        {"cantidad": 1, "descripcion": "Encendedor", "observaciones": ""},
    ],
]


def calcular_dv(cuerpo: str) -> str:
    factores = [2, 3, 4, 5, 6, 7]
    total = sum(int(d) * factores[i % 6] for i, d in enumerate(reversed(cuerpo)))
    resto = 11 - (total % 11)
    return "0" if resto == 11 else "K" if resto == 10 else str(resto)


def fecha_aleatoria(dias_atras: int) -> str:
    return (date.today() - timedelta(days=dias_atras)).isoformat()


def registro_aleatorio(rng: random.Random, dias_atras: int) -> dict:
    cuerpo, nombre, curso = rng.choice(ESTUDIANTES)
    rut = f"{cuerpo}-{calcular_dv(cuerpo)}"
    presentes = rng.sample(FUNCIONARIOS, k=rng.choice([1, 2]))
    hora_inicio_min = rng.randint(8 * 60, 16 * 60)
    hora_termino_min = hora_inicio_min + rng.randint(10, 40)

    return {
        "estudiante": {"rut": rut, "nombre": nombre, "curso": curso},
        "funcionarios_presentes": [
            {
                "rut": f"{cuerpo}-{calcular_dv(cuerpo)}",
                "nombre": nombre,
                "cargo": cargo,
            }
            for cuerpo, nombre, cargo in presentes
        ],
        "motivo": rng.choice(MOTIVOS),
        "elementos_encontrados": rng.choice(ELEMENTOS),
        "fecha": fecha_aleatoria(dias_atras),
        "hora_inicio": f"{hora_inicio_min // 60:02d}:{hora_inicio_min % 60:02d}",
        "hora_termino": f"{hora_termino_min // 60:02d}:{hora_termino_min % 60:02d}",
    }


def main() -> None:
    rng = random.Random(42)
    creados = 0
    errores = 0

    with httpx.Client(base_url=API_URL, timeout=10) as client:
        login = client.post("/auth/login", json={"username": SEED_USER, "password": SEED_PASSWORD})
        if login.status_code != 200:
            print(f"No se pudo iniciar sesión ({login.status_code}): {login.text}")
            print("Ejecuta primero: python scripts/seed_usuarios.py")
            return
        client.headers["Authorization"] = f"Bearer {login.json()['access_token']}"
        for cuerpo, nombre, curso in ESTUDIANTES:
            ruta = f"{cuerpo}-{calcular_dv(cuerpo)}"
            client.post("/estudiantes", json={"rut": ruta, "nombre": nombre, "curso": curso})
        for cuerpo, nombre, cargo in FUNCIONARIOS:
            ruta = f"{cuerpo}-{calcular_dv(cuerpo)}"
            client.post("/funcionarios", json={"rut": ruta, "nombre": nombre, "cargo": cargo})
        for dias_atras in range(0, 120, 4):
            payload = registro_aleatorio(rng, dias_atras)
            response = client.post("/registros", json=payload)
            if response.status_code == 201:
                creados += 1
            else:
                errores += 1
                print(f"  ! {payload['fecha']} {payload['estudiante']['nombre']}: {response.status_code} {response.text}")

    print(f"\nListo: {creados} registros creados, {errores} con error.")


if __name__ == "__main__":
    main()
