from collections import Counter

from sqlalchemy.orm import Session

from app.models.registro import RegistroRevision
from app.schemas.estadisticas import ConteoItem, EstadisticasOut


def _por_cantidad_desc(conteo: Counter) -> list[ConteoItem]:
    return [
        ConteoItem(nombre=nombre, cantidad=cantidad)
        for nombre, cantidad in sorted(conteo.items(), key=lambda item: (-item[1], item[0]))
    ]


def calcular_estadisticas(db: Session) -> EstadisticasOut:
    registros = db.query(
        RegistroRevision.fecha,
        RegistroRevision.motivo,
        RegistroRevision.estudiante_curso,
    ).all()

    por_mes: Counter = Counter()
    por_motivo: Counter = Counter()
    por_curso: Counter = Counter()

    for fecha, motivo, curso in registros:
        por_mes[fecha.strftime("%Y-%m")] += 1
        por_motivo[motivo] += 1
        por_curso[curso] += 1

    return EstadisticasOut(
        total=len(registros),
        por_mes=[
            ConteoItem(nombre=mes, cantidad=cantidad)
            for mes, cantidad in sorted(por_mes.items())
        ],
        por_motivo=_por_cantidad_desc(por_motivo),
        por_curso=_por_cantidad_desc(por_curso),
    )
