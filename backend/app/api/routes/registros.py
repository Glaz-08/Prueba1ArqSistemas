from fastapi import APIRouter

router = APIRouter()


@router.get("")
def listar_registros() -> dict:
    """Listado de registros de revisión. Se implementará en el MVP."""
    return {"items": [], "total": 0}
