import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { descargarDocumentoHtml, obtenerRegistro, urlEvidencia } from "../api/registros";
import type { Registro } from "../types";

function hora(valor: string): string {
  return valor.slice(0, 5);
}

export default function DetalleRegistro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    obtenerRegistro(id)
      .then(setRegistro)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se encontró el registro");
      });
  }, [id]);

  async function descargar() {
    if (!id) {
      return;
    }
    try {
      await descargarDocumentoHtml(id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo descargar la copia");
    }
  }

  if (error) {
    return (
      <main className="layout">
        <p className="error">{error}</p>
        <Link to="/">Volver</Link>
      </main>
    );
  }

  if (!registro || !id) {
    return (
      <main className="layout">
        <p>Cargando registro…</p>
      </main>
    );
  }

  return (
    <main className="layout">
      <p className="eyebrow">Detalle del procedimiento</p>
      <h1>{registro.estudiante.nombre}</h1>
      <div className="acciones no-print">
        <Link className="button" to={`/registros/${id}/copia`}>
          Ver copia
        </Link>
        <button
          type="button"
          className="button secondary"
          onClick={() => navigate(`/registros/${id}/copia?print=1`)}
        >
          Imprimir
        </button>
        <button type="button" className="button secondary" onClick={() => void descargar()}>
          Descargar copia
        </button>
      </div>

      <section className="card">
        <h2>Estudiante</h2>
        <p>
          {registro.estudiante.nombre} · RUT {registro.estudiante.rut} · {registro.estudiante.curso}
        </p>
        <h2>Horario</h2>
        <p>
          {registro.fecha} · {hora(registro.hora_inicio)} – {hora(registro.hora_termino)}
        </p>
        <h2>Motivo</h2>
        <p>{registro.motivo}</p>
        <h2>Funcionarios presentes</h2>
        <ul>
          {registro.funcionarios_presentes.map((item) => (
            <li key={item.id}>
              {item.nombre} — {item.cargo}
            </li>
          ))}
        </ul>
        <h2>Elementos encontrados</h2>
        {registro.elementos_encontrados.length === 0 ? (
          <p>No se registraron elementos encontrados.</p>
        ) : (
          <ul>
            {registro.elementos_encontrados.map((item) => (
              <li key={item.id}>
                {item.cantidad} × {item.descripcion}
                {item.observaciones ? ` (${item.observaciones})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {registro.evidencias.length > 0 && (
        <section className="card">
          <h2>Evidencia fotográfica</h2>
          <div className="evidencias">
            {registro.evidencias.map((item) => (
              <figure key={item.id}>
                <img src={urlEvidencia(id, item.id)} alt={item.nombre_archivo} />
                <figcaption>{item.nombre_archivo}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
