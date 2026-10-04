"""Crea los usuarios de prueba (un admin y un funcionario) en la base de datos.

Uso, con el backend ya creado las tablas (por ejemplo después de levantar la app):

    python scripts/seed_usuarios.py

Es idempotente: no duplica usuarios si ya existen.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.usuario import Usuario

USUARIOS_PRUEBA = [
    {
        "nombre": "Administrador",
        "username": "admin",
        "password": "admin123",
        "rol": "admin",
        "cargo": "Administrador",
    },
    {
        "nombre": "Laura Fuentes",
        "username": "funcionario",
        "password": "funcionario123",
        "rol": "funcionario",
        "cargo": "Inspectora",
    },
]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for datos in USUARIOS_PRUEBA:
            existe = db.query(Usuario).filter(Usuario.username == datos["username"]).first()
            if existe:
                print(f"  = {datos['username']} ya existe, se omite")
                continue
            db.add(
                Usuario(
                    nombre=datos["nombre"],
                    username=datos["username"],
                    password_hash=hash_password(datos["password"]),
                    rol=datos["rol"],
                    cargo=datos.get("cargo", ""),
                )
            )
            print(f"  + creado {datos['username']} ({datos['rol']})")
        db.commit()
    finally:
        db.close()
    print("Listo.")


if __name__ == "__main__":
    main()
