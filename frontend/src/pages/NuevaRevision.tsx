import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adjuntarEvidencia, crearRegistro } from "../api/registros";
import type { ElementoEncontrado, Estudiante, Funcionario } from "../types";

const PASOS = [
  "Estudiante",
  "Presentes",
  "Motivo y elementos",
  "Fecha y horario",
  "Evidencia",
  "Confirmación",
];

const CARGOS = [
  "Inspector general",
  "Inspector de patio",
  "Orientador/a de convivencia",
  "Docente",
  "Directivo",
];

function funcionarioVacio(): Funcionario {
  return { nombre: "", cargo: CARGOS[0] };
}

function elementoVacio(): ElementoEncontrado {
  return { cantidad: 1, descripcion: "", observaciones: "" };
}

export default function NuevaRevision() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estudiante, setEstudiante] = useState<Estudiante>({
    rut: "",
    nombre: "",
    curso: "",
  });
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([funcionarioVacio()]);
  const [motivo, setMotivo] = useState("");
  const [elementos, setElementos] = useState<ElementoEncontrado[]>([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaTermino, setHoraTermino] = useState("09:20");
  const [fotos, setFotos] = useState<File[]>([]);

  const resumenElementos = useMemo(
    () => elementos.filter((item) => item.descripcion.trim()),
    [elementos],
  );

  function validarPaso(): string | null {
    if (paso === 0) {
      if (!estudiante.rut.trim() || !estudiante.nombre.trim() || !estudiante.curso.trim()) {
        return "Completa RUT, nombre y curso del estudiante.";
      }
    }
    if (paso === 1) {
      const validos = funcionarios.filter((item) => item.nombre.trim() && item.cargo.trim());
      if (validos.length === 0) {
        return "Debe haber al menos un funcionario presente.";
      }
    }
    if (paso === 2 && motivo.trim().length < 5) {
      return "Describe el motivo de la revisión (mínimo 5 caracteres).";
    }
    if (paso === 3) {
      if (!fecha || !horaInicio || !horaTermino) {
        return "Indica fecha, hora de inicio y hora de término.";
      }
      if (horaTermino <= horaInicio) {
        return "La hora de término debe ser posterior a la de inicio.";
      }
    }
    return null;
  }

  function siguiente() {
    const mensaje = validarPaso();
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setError(null);
    setPaso((actual) => Math.min(actual + 1, PASOS.length - 1));
  }

  async function enviar() {
    const mensaje = validarPaso();
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const creado = await crearRegistro({
        estudiante,
        funcionarios_presentes: funcionarios.filter(
          (item) => item.nombre.trim() && item.cargo.trim(),
        ),
        motivo,
        elementos_encontrados: resumenElementos,
        fecha,
        hora_inicio: horaInicio,
        hora_termino: horaTermino,
      });
      for (const foto of fotos) {
        await adjuntarEvidencia(creado.id, foto);
      }
      navigate(`/registros/${creado.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el registro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="layout">
      <p className="eyebrow">Nueva revisión</p>
      <h1>Formulario de procedimiento</h1>
      <ol className="pasos">
        {PASOS.map((nombre, indice) => (
          <li key={nombre} className={indice === paso ? "activo" : indice < paso ? "hecho" : ""}>
            {indice + 1}. {nombre}
          </li>
        ))}
      </ol>

      {paso === 0 && (
        <section className="card form-grid">
          <h2>Estudiante involucrado</h2>
          <label>
            RUT
            <input
              value={estudiante.rut}
              onChange={(e) => setEstudiante({ ...estudiante, rut: e.target.value })}
              placeholder="12.345.678-5"
            />
          </label>
          <label>
            Nombre completo
            <input
              value={estudiante.nombre}
              onChange={(e) => setEstudiante({ ...estudiante, nombre: e.target.value })}
            />
          </label>
          <label>
            Curso
            <input
              value={estudiante.curso}
              onChange={(e) => setEstudiante({ ...estudiante, curso: e.target.value })}
              placeholder="2° medio A"
            />
          </label>
        </section>
      )}

      {paso === 1 && (
        <section className="card">
          <h2>Funcionarios presentes</h2>
          {funcionarios.map((item, indice) => (
            <div className="fila-dinamica" key={indice}>
              <label>
                Nombre
                <input
                  value={item.nombre}
                  onChange={(e) => {
                    const copia = [...funcionarios];
                    copia[indice] = { ...item, nombre: e.target.value };
                    setFuncionarios(copia);
                  }}
                />
              </label>
              <label>
                Cargo / rol en la revisión
                <input
                  list="cargos"
                  value={item.cargo}
                  onChange={(e) => {
                    const copia = [...funcionarios];
                    copia[indice] = { ...item, cargo: e.target.value };
                    setFuncionarios(copia);
                  }}
                />
              </label>
              {funcionarios.length > 1 && (
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setFuncionarios(funcionarios.filter((_, i) => i !== indice))}
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
          <datalist id="cargos">
            {CARGOS.map((cargo) => (
              <option key={cargo} value={cargo} />
            ))}
          </datalist>
          <button
            type="button"
            className="button secondary"
            onClick={() => setFuncionarios([...funcionarios, funcionarioVacio()])}
          >
            Agregar funcionario
          </button>
        </section>
      )}

      {paso === 2 && (
        <section className="card">
          <h2>Motivo y elementos encontrados</h2>
          <label>
            Motivo de la revisión
            <textarea
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Indica el fundamento del procedimiento."
            />
          </label>
          <h3>Elementos encontrados</h3>
          <p className="ayuda">Si no se encontró nada, continúa sin agregar filas.</p>
          {elementos.map((item, indice) => (
            <div className="fila-dinamica" key={indice}>
              <label>
                Cantidad
                <input
                  type="number"
                  min={1}
                  value={item.cantidad}
                  onChange={(e) => {
                    const copia = [...elementos];
                    copia[indice] = { ...item, cantidad: Number(e.target.value) };
                    setElementos(copia);
                  }}
                />
              </label>
              <label>
                Descripción
                <input
                  value={item.descripcion}
                  onChange={(e) => {
                    const copia = [...elementos];
                    copia[indice] = { ...item, descripcion: e.target.value };
                    setElementos(copia);
                  }}
                />
              </label>
              <label>
                Observaciones
                <input
                  value={item.observaciones}
                  onChange={(e) => {
                    const copia = [...elementos];
                    copia[indice] = { ...item, observaciones: e.target.value };
                    setElementos(copia);
                  }}
                />
              </label>
              <button
                type="button"
                className="button ghost"
                onClick={() => setElementos(elementos.filter((_, i) => i !== indice))}
              >
                Quitar
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() => setElementos([...elementos, elementoVacio()])}
          >
            Agregar elemento
          </button>
        </section>
      )}

      {paso === 3 && (
        <section className="card form-grid">
          <h2>Fecha y horarios del procedimiento</h2>
          <label>
            Fecha
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label>
            Hora de inicio
            <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </label>
          <label>
            Hora de término
            <input
              type="time"
              value={horaTermino}
              onChange={(e) => setHoraTermino(e.target.value)}
            />
          </label>
        </section>
      )}

      {paso === 4 && (
        <section className="card">
          <h2>Evidencia fotográfica (opcional)</h2>
          <p className="ayuda">JPG, PNG o WEBP. Máximo 5 MB por archivo.</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => setFotos(Array.from(e.target.files ?? []))}
          />
          {fotos.length > 0 && (
            <ul>
              {fotos.map((foto) => (
                <li key={foto.name}>{foto.name}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {paso === 5 && (
        <section className="card">
          <h2>Confirmar registro</h2>
          <dl className="resumen">
            <dt>Estudiante</dt>
            <dd>
              {estudiante.nombre} · {estudiante.rut} · {estudiante.curso}
            </dd>
            <dt>Presentes</dt>
            <dd>
              {funcionarios
                .filter((item) => item.nombre.trim())
                .map((item) => `${item.nombre} (${item.cargo})`)
                .join("; ")}
            </dd>
            <dt>Motivo</dt>
            <dd>{motivo}</dd>
            <dt>Elementos</dt>
            <dd>
              {resumenElementos.length === 0
                ? "Sin elementos encontrados"
                : resumenElementos
                    .map((item) => `${item.cantidad} × ${item.descripcion}`)
                    .join("; ")}
            </dd>
            <dt>Horario</dt>
            <dd>
              {fecha} · {horaInicio} – {horaTermino}
            </dd>
            <dt>Evidencia</dt>
            <dd>
              {fotos.length === 0 ? "No se adjunta fotografía" : `${fotos.length} archivo(s)`}
            </dd>
          </dl>
        </section>
      )}

      {error && <p className="error">{error}</p>}

      <div className="acciones">
        {paso > 0 && (
          <button type="button" className="button secondary" onClick={() => setPaso(paso - 1)}>
            Atrás
          </button>
        )}
        {paso < PASOS.length - 1 ? (
          <button type="button" className="button" onClick={siguiente}>
            Continuar
          </button>
        ) : (
          <button type="button" className="button" disabled={enviando} onClick={() => void enviar()}>
            {enviando ? "Guardando…" : "Registrar procedimiento"}
          </button>
        )}
      </div>
    </main>
  );
}
