import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { descargarDocumentoHtml, obtenerRegistro } from "../api/registros";
import type { Registro } from "../types";

function hora(valor: string): string {
  return valor.slice(0, 5);
}

export default function CopiaImprimible() {
  const { id } = useParams();
  const [params] = useSearchParams();
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

  useEffect(() => {
    if (registro && params.get("print") === "1") {
      const timer = window.setTimeout(() => window.print(), 300);
      return () => window.clearTimeout(timer);
    }
  }, [registro, params]);

  if (error) {
    return (
      <main className="layout">
        <p className="error">{error}</p>
      </main>
    );
  }

  if (!registro || !id) {
    return (
      <main className="layout">
        <p>Preparando copia…</p>
      </main>
    );
  }

  return (
    <main className="documento">
      <div className="acciones no-print">
        <Link className="button secondary" to={`/registros/${id}`}>
          Volver al detalle
        </Link>
        <button type="button" className="button" onClick={() => window.print()}>
          Imprimir
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => void descargarDocumentoHtml(id)}
        >
          Descargar copia
        </button>
      </div>

      <article className="hoja">
        <p className="eyebrow">Ley 21.827</p>
        <h1>Registro de revisión de pertenencias</h1>
        <p className="meta">Copia para estudiante y apoderado · Folio {registro.id}</p>

        <section>
          <h2>Estudiante</h2>
          <p>
            <strong>Nombre:</strong> {registro.estudiante.nombre}
            <br />
            <strong>RUT:</strong> {registro.estudiante.rut}
            <br />
            <strong>Curso:</strong> {registro.estudiante.curso}
          </p>
        </section>
        <section>
          <h2>Procedimiento</h2>
          <p>
            <strong>Fecha:</strong> {registro.fecha}
            <br />
            <strong>Hora de inicio:</strong> {hora(registro.hora_inicio)}
            <br />
            <strong>Hora de término:</strong> {hora(registro.hora_termino)}
          </p>
        </section>
        <section>
          <h2>Motivo de la revisión</h2>
          <p>{registro.motivo}</p>
        </section>
        <section>
          <h2>Funcionarios presentes</h2>
          <ul>
            {registro.funcionarios_presentes.map((item) => (
              <li key={item.id}>
                {item.nombre} — {item.cargo}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Elementos encontrados</h2>
          {registro.elementos_encontrados.length === 0 ? (
            <p>No se registraron elementos encontrados.</p>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Cant.</th>
                  <th>Descripción</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {registro.elementos_encontrados.map((item) => (
                  <tr key={item.id}>
                    <td>{item.cantidad}</td>
                    <td>{item.descripcion}</td>
                    <td>{item.observaciones || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section>
          <h2>Evidencia fotográfica</h2>
          <p>
            {registro.evidencias.length === 0
              ? "No se adjuntó evidencia fotográfica"
              : `Sí (${registro.evidencias.length} archivo(s) en el expediente)`}
          </p>
        </section>
        <div className="firmas">
          <div>Funcionario responsable</div>
          <div>Estudiante</div>
          <div>Apoderado</div>
        </div>
      </article>
    </main>
  );
}
