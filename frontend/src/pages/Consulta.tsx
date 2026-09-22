import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { listarRegistros } from "../api/registros";
import { CURSOS_BASICA, CURSOS_MEDIA } from "../data/cursos";
import type { FiltrosConsulta, RegistroResumen } from "../types";

function formatoHora(valor: string): string {
  return valor.slice(0, 5);
}

const OTRO_CURSO = "__otro__";

const FILTROS_VACIOS: FiltrosConsulta = {
  estudiante: "",
  motivo: "",
  fechaDesde: "",
  fechaHasta: "",
};

export default function Consulta() {
  const [filtros, setFiltros] = useState<FiltrosConsulta>(FILTROS_VACIOS);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [cursoOtro, setCursoOtro] = useState("");
  const [registros, setRegistros] = useState<RegistroResumen[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buscoAlMenosUnaVez, setBuscoAlMenosUnaVez] = useState(false);

  async function buscar(filtrosActuales: FiltrosConsulta) {
    setBuscando(true);
    setError(null);
    try {
      const data = await listarRegistros(filtrosActuales);
      setRegistros(data.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No fue posible buscar registros");
    } finally {
      setBuscando(false);
      setBuscoAlMenosUnaVez(true);
    }
  }

  function curso(): string {
    return cursoSeleccionado === OTRO_CURSO ? cursoOtro.trim() : cursoSeleccionado;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void buscar({ ...filtros, curso: curso() });
  }

  function limpiar() {
    setFiltros(FILTROS_VACIOS);
    setCursoSeleccionado("");
    setCursoOtro("");
    void buscar(FILTROS_VACIOS);
  }

  return (
    <main className="layout">
      <p className="eyebrow">Consulta</p>
      <h1>Buscar revisiones registradas</h1>
      <p className="lead">
        Filtra por estudiante (nombre o RUT), motivo, o un rango de fechas. Deja los campos
        vacíos y presiona Buscar para ver todos los registros.
      </p>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <label>
          Estudiante (nombre o RUT)
          <input
            value={filtros.estudiante}
            onChange={(e) => setFiltros({ ...filtros, estudiante: e.target.value })}
            placeholder="Camila Soto o 12.345.678-5"
            maxLength={50}
          />
        </label>
        <label>
          Curso
          <select
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
          >
            <option value="">Todos los cursos</option>
            <optgroup label="Educación Básica">
              {CURSOS_BASICA.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </optgroup>
            <optgroup label="Educación Media">
              {CURSOS_MEDIA.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </optgroup>
            <option value={OTRO_CURSO}>Otro (especificar)</option>
          </select>
        </label>
        {cursoSeleccionado === OTRO_CURSO && (
          <label>
            Especifica el curso
            <input
              value={cursoOtro}
              onChange={(e) => setCursoOtro(e.target.value)}
              placeholder="Ej: 2° Medio D, Técnico Profesional"
              maxLength={50}
            />
          </label>
        )}
        <label>
          Motivo
          <input
            value={filtros.motivo}
            onChange={(e) => setFiltros({ ...filtros, motivo: e.target.value })}
            placeholder="Ej: objeto prohibido"
            maxLength={200}
          />
        </label>
        <label>
          Fecha desde
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
          />
        </label>
        <label>
          Fecha hasta
          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
          />
        </label>
        <div className="acciones">
          <button type="submit" className="button" disabled={buscando}>
            {buscando ? "Buscando…" : "Buscar"}
          </button>
          <button type="button" className="button secondary" onClick={limpiar} disabled={buscando}>
            Limpiar
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {buscoAlMenosUnaVez && !error && (
        <section className="card">
          <h2>Resultados {registros ? `(${registros.length})` : ""}</h2>
          {registros && registros.length === 0 ? (
            <p>No se encontraron revisiones con esos filtros.</p>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estudiante</th>
                  <th>Curso</th>
                  <th>Motivo</th>
                  <th>Horario</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {registros?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.fecha}</td>
                    <td>{item.estudiante_nombre}</td>
                    <td>{item.estudiante_curso}</td>
                    <td>{item.motivo}</td>
                    <td>
                      {formatoHora(item.hora_inicio)} – {formatoHora(item.hora_termino)}
                    </td>
                    <td>
                      <Link to={`/registros/${item.id}`}>Ver detalle</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </main>
  );
}
