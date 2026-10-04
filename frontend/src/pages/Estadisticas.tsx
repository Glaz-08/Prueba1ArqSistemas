import { useEffect, useState } from "react";
import { obtenerEstadisticas } from "../api/registros";
import type { ConteoItem, Estadisticas as EstadisticasData } from "../types";

const NOMBRES_MES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatoMes(valor: string): string {
  const [anio, mes] = valor.split("-");
  const indice = Number(mes) - 1;
  return `${NOMBRES_MES[indice] ?? mes} ${anio}`;
}

function Desglose({
  titulo,
  items,
  formatoNombre,
}: {
  titulo: string;
  items: ConteoItem[];
  formatoNombre?: (nombre: string) => string;
}) {
  const maximo = Math.max(1, ...items.map((item) => item.cantidad));

  return (
    <section className="card">
      <h2>{titulo}</h2>
      {items.length === 0 ? (
        <p>Sin datos todavía.</p>
      ) : (
        items.map((item) => (
          <div key={item.nombre}>
            <div className="chart-line">
              <span>{formatoNombre ? formatoNombre(item.nombre) : item.nombre}</span>
              <strong>{item.cantidad}</strong>
            </div>
            <div className="bar">
              <span style={{ width: `${(item.cantidad / maximo) * 100}%` }} />
            </div>
          </div>
        ))
      )}
    </section>
  );
}

export default function Estadisticas() {
  const [datos, setDatos] = useState<EstadisticasData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerEstadisticas()
      .then(setDatos)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No fue posible cargar las estadísticas");
      });
  }, []);

  const mesActual = new Date().toISOString().slice(0, 7);
  const mesReciente =
    datos?.por_mes.find((item) => item.nombre === mesActual) ?? datos?.por_mes.at(-1);

  return (
    <main className="layout">
      <div className="intro">
        <p className="eyebrow">Estadísticas</p>
        <h1>Una mirada a los registros</h1>
        <p>Totales y distribución de los procedimientos registrados.</p>
      </div>

      {error && <p className="error">{error}</p>}

      {!error && !datos && <p>Cargando estadísticas…</p>}

      {datos && (
        <>
          <section className="stats">
            <div className="stat">
              <span className="stat-icon" aria-hidden>
                ▥
              </span>
              <div>
                <strong>{datos.total}</strong>
                <small>{datos.total === 1 ? "Revisión total" : "Revisiones totales"}</small>
              </div>
            </div>
            <div className="stat">
              <span className="stat-icon" aria-hidden>
                ▤
              </span>
              <div>
                <strong>{mesReciente?.cantidad ?? 0}</strong>
                <small>
                  {mesReciente
                    ? `Revisiones en ${formatoMes(mesReciente.nombre)}`
                    : "Sin revisiones este mes"}
                </small>
              </div>
            </div>
            <div className="stat">
              <span className="stat-icon" aria-hidden>
                ♧
              </span>
              <div>
                <strong>{datos.por_curso.length}</strong>
                <small>
                  {datos.por_curso.length === 1 ? "Curso con registros" : "Cursos con registros"}
                </small>
              </div>
            </div>
          </section>

          <Desglose titulo="Revisiones por mes" items={datos.por_mes} formatoNombre={formatoMes} />
          <div className="charts">
            <Desglose titulo="Por motivo" items={datos.por_motivo} />
            <Desglose titulo="Por curso" items={datos.por_curso} />
          </div>
        </>
      )}
    </main>
  );
}
