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

function Desglose({ titulo, items, formatoNombre }: {
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
        <ul className="desglose">
          {items.map((item) => (
            <li key={item.nombre}>
              <div className="desglose-fila">
                <span>{formatoNombre ? formatoNombre(item.nombre) : item.nombre}</span>
                <span>{item.cantidad}</span>
              </div>
              <div className="barra-fondo">
                <div
                  className="barra"
                  style={{ width: `${(item.cantidad / maximo) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
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

  return (
    <main className="layout">
      <p className="eyebrow">Estadísticas</p>
      <h1>Panel de revisiones</h1>
      <p className="lead">Totales y desglose de las revisiones registradas hasta ahora.</p>

      {error && <p className="error">{error}</p>}

      {!error && !datos && <p>Cargando estadísticas…</p>}

      {datos && (
        <>
          <section className="stat-grid">
            <div className="stat-tile">
              <span className="stat-valor">{datos.total}</span>
              <span className="stat-etiqueta">Revisiones totales</span>
            </div>
          </section>

          <Desglose titulo="Revisiones por mes" items={datos.por_mes} formatoNombre={formatoMes} />
          <Desglose titulo="Revisiones por motivo" items={datos.por_motivo} />
          <Desglose titulo="Revisiones por curso" items={datos.por_curso} />
        </>
      )}
    </main>
  );
}
