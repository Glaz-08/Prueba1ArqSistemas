from html import escape

from app.models.registro import RegistroRevision


def _fmt_fecha(registro: RegistroRevision) -> str:
    return registro.fecha.strftime("%d-%m-%Y")


def _fmt_hora(valor) -> str:
    return valor.strftime("%H:%M")


def documento_payload(registro: RegistroRevision) -> dict:
    return {
        "titulo": "Registro de revisión de pertenencias",
        "norma": "Ley 21.827",
        "id": registro.id,
        "estudiante": {
            "rut": registro.estudiante_rut,
            "nombre": registro.estudiante_nombre,
            "curso": registro.estudiante_curso,
        },
        "funcionarios_presentes": [
            {"nombre": item.nombre, "cargo": item.cargo}
            for item in registro.funcionarios
        ],
        "motivo": registro.motivo,
        "elementos_encontrados": [
            {
                "cantidad": item.cantidad,
                "descripcion": item.descripcion,
                "observaciones": item.observaciones,
            }
            for item in registro.elementos
        ],
        "fecha": registro.fecha.isoformat(),
        "hora_inicio": registro.hora_inicio.strftime("%H:%M"),
        "hora_termino": registro.hora_termino.strftime("%H:%M"),
        "tiene_evidencia_fotografica": len(registro.evidencias) > 0,
        "cantidad_evidencias": len(registro.evidencias),
    }


def render_documento_html(registro: RegistroRevision) -> str:
    funcionarios = "".join(
        f"<li>{escape(item.nombre)} — {escape(item.cargo)}</li>"
        for item in registro.funcionarios
    )
    if registro.elementos:
        elementos = "".join(
            (
                "<tr>"
                f"<td>{item.cantidad}</td>"
                f"<td>{escape(item.descripcion)}</td>"
                f"<td>{escape(item.observaciones or '—')}</td>"
                "</tr>"
            )
            for item in registro.elementos
        )
        tabla_elementos = (
            "<table><thead><tr><th>Cant.</th><th>Descripción</th>"
            "<th>Observaciones</th></tr></thead><tbody>"
            f"{elementos}</tbody></table>"
        )
    else:
        tabla_elementos = "<p>No se registraron elementos encontrados.</p>"

    evidencia = (
        f"Sí ({len(registro.evidencias)} archivo(s))"
        if registro.evidencias
        else "No se adjuntó evidencia fotográfica"
    )

    return f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Copia de registro {escape(registro.id)}</title>
  <style>
    body {{ font-family: Georgia, "Times New Roman", serif; margin: 24px; color: #111; }}
    h1 {{ font-size: 20px; margin-bottom: 4px; }}
    .meta {{ color: #444; margin-bottom: 24px; }}
    section {{ margin-bottom: 18px; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th, td {{ border: 1px solid #333; padding: 6px 8px; text-align: left; }}
    .firmas {{ display: flex; gap: 40px; margin-top: 48px; }}
    .firma {{ flex: 1; border-top: 1px solid #333; padding-top: 8px; }}
    @media print {{ body {{ margin: 12mm; }} }}
  </style>
</head>
<body>
  <h1>Registro de revisión de pertenencias</h1>
  <p class="meta">Ley 21.827 · Copia para estudiante y apoderado · Folio {escape(registro.id)}</p>
  <section>
    <h2>Estudiante</h2>
    <p><strong>Nombre:</strong> {escape(registro.estudiante_nombre)}<br/>
       <strong>RUT:</strong> {escape(registro.estudiante_rut)}<br/>
       <strong>Curso:</strong> {escape(registro.estudiante_curso)}</p>
  </section>
  <section>
    <h2>Procedimiento</h2>
    <p><strong>Fecha:</strong> {_fmt_fecha(registro)}<br/>
       <strong>Hora de inicio:</strong> {_fmt_hora(registro.hora_inicio)}<br/>
       <strong>Hora de término:</strong> {_fmt_hora(registro.hora_termino)}</p>
  </section>
  <section>
    <h2>Motivo de la revisión</h2>
    <p>{escape(registro.motivo)}</p>
  </section>
  <section>
    <h2>Funcionarios presentes</h2>
    <ul>{funcionarios}</ul>
  </section>
  <section>
    <h2>Elementos encontrados</h2>
    {tabla_elementos}
  </section>
  <section>
    <h2>Evidencia fotográfica</h2>
    <p>{evidencia}</p>
  </section>
  <div class="firmas">
    <div class="firma">Funcionario responsable</div>
    <div class="firma">Estudiante</div>
    <div class="firma">Apoderado</div>
  </div>
</body>
</html>
"""
