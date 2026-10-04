import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adjuntarEvidencia, crearRegistro } from "../api/registros";
import {
  listarEstudiantes,
  listarFuncionarios,
  obtenerEstudiantePorRut,
  obtenerFuncionarioPorRut,
} from "../api/catalogos";
import type { ElementoEncontrado, Estudiante, Funcionario } from "../types";
import { RUT_MAX_LENGTH, validarRut } from "../utils/rut";

const PASOS = [
  "Estudiante",
  "Presentes",
  "Motivo y elementos",
  "Fecha y horario",
  "Evidencia",
  "Confirmación",
];

function funcionarioVacio(): Funcionario {
  return { nombre: "", cargo: "", rut: "", encontrado: false };
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

  // Autocomplete
  const [estudianteSugerencias, setEstudianteSugerencias] = useState<Estudiante[]>([]);
  const [funcionarioSugerencias, setFuncionarioSugerencias] = useState<Map<number, Funcionario[]>>(() => new Map());
  const [mostrarEstudiantes, setMostrarEstudiantes] = useState(false);
  const [estudianteEncontrado, setEstudianteEncontrado] = useState(false);
  const [buscandoEstudiante, setBuscandoEstudiante] = useState(false);
  const [mostrarFuncionarios, setMostrarFuncionarios] = useState<number | null>(null);
  const [buscandoFuncionario, setBuscandoFuncionario] = useState<number | null>(null);
  const estudianteInputRef = useRef<HTMLInputElement>(null);
  const funcionarioInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Debounce timers
  const estudianteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const funcionarioDebounceRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map<number, ReturnType<typeof setTimeout>>());

  const resumenElementos = useMemo(
    () => elementos.filter((item) => item.descripcion.trim()),
    [elementos],
  );

  // Busca en el catálogo: RUT completo rellena nombre y curso; si no, sugiere coincidencias.
  useEffect(() => {
    if (estudianteDebounceRef.current) clearTimeout(estudianteDebounceRef.current);
    const rut = estudiante.rut.trim();
    if (rut.length < 3) {
      setEstudianteSugerencias([]);
      setMostrarEstudiantes(false);
      setBuscandoEstudiante(false);
      return;
    }
    estudianteDebounceRef.current = setTimeout(async () => {
      if (validarRut(rut)) {
        setBuscandoEstudiante(true);
        try {
          const encontrado = await obtenerEstudiantePorRut(rut);
          setEstudiante({ rut: encontrado.rut, nombre: encontrado.nombre, curso: encontrado.curso });
          setEstudianteEncontrado(true);
          setEstudianteSugerencias([]);
          setMostrarEstudiantes(false);
          setError(null);
        } catch {
          setEstudiante((actual) => ({ ...actual, nombre: "", curso: "" }));
          setEstudianteEncontrado(false);
          setError("El estudiante no está registrado. Agrégalo primero en Estudiantes.");
        } finally {
          setBuscandoEstudiante(false);
        }
        return;
      }
      try {
        const resultados = await listarEstudiantes(rut);
        setEstudianteSugerencias(resultados.slice(0, 10));
        setMostrarEstudiantes(resultados.length > 0);
      } catch {
        setEstudianteSugerencias([]);
        setMostrarEstudiantes(false);
      }
    }, 300);
    return () => {
      if (estudianteDebounceRef.current) clearTimeout(estudianteDebounceRef.current);
    };
  }, [estudiante.rut]);

  function buscarFuncionarios(indice: number, rut: string) {
    if (funcionarioDebounceRefs.current.has(indice)) {
      clearTimeout(funcionarioDebounceRefs.current.get(indice)!);
    }
    const limpio = rut.trim();
    if (limpio.length < 3) {
      setFuncionarioSugerencias((prev) => {
        const nuevo = new Map(prev);
        nuevo.set(indice, []);
        return nuevo;
      });
      setBuscandoFuncionario(null);
      return;
    }
    const timeout = setTimeout(async () => {
      if (validarRut(limpio)) {
        setBuscandoFuncionario(indice);
        try {
          const encontrado = await obtenerFuncionarioPorRut(limpio);
          setFuncionarios((actuales) => {
            const copia = [...actuales];
            copia[indice] = {
              ...copia[indice],
              rut: encontrado.rut,
              nombre: encontrado.nombre,
              cargo: encontrado.cargo,
              encontrado: true,
            };
            return copia;
          });
          setFuncionarioSugerencias((prev) => {
            const nuevo = new Map(prev);
            nuevo.set(indice, []);
            return nuevo;
          });
          setMostrarFuncionarios(null);
          setError(null);
        } catch {
          setFuncionarios((actuales) => {
            const copia = [...actuales];
            copia[indice] = { ...copia[indice], nombre: "", cargo: "", encontrado: false };
            return copia;
          });
          setError("El funcionario no está registrado. Agrégalo primero en Funcionarios.");
        } finally {
          setBuscandoFuncionario(null);
        }
        return;
      }
      try {
        const resultados = await listarFuncionarios(limpio);
        setFuncionarioSugerencias((prev) => {
          const nuevo = new Map(prev);
          nuevo.set(indice, resultados.slice(0, 10));
          return nuevo;
        });
        setMostrarFuncionarios(indice);
      } catch {
        setFuncionarioSugerencias((prev) => {
          const nuevo = new Map(prev);
          nuevo.set(indice, []);
          return nuevo;
        });
      }
    }, 300);
    funcionarioDebounceRefs.current.set(indice, timeout);
  }

  function seleccionarEstudiante(est: Estudiante) {
    setEstudiante({ rut: est.rut, nombre: est.nombre, curso: est.curso });
    setEstudianteEncontrado(true);
    setEstudianteSugerencias([]);
    setMostrarEstudiantes(false);
    setError(null);
  }

  function seleccionarFuncionario(indice: number, func: Funcionario) {
    const copia = [...funcionarios];
    copia[indice] = {
      ...copia[indice],
      rut: func.rut,
      nombre: func.nombre,
      cargo: func.cargo,
      encontrado: true,
    };
    setFuncionarios(copia);
    setFuncionarioSugerencias((prev) => {
      const nuevo = new Map(prev);
      nuevo.set(indice, []);
      return nuevo;
    });
    setMostrarFuncionarios(null);
    setError(null);
  }

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (estudianteInputRef.current && !estudianteInputRef.current.contains(e.target as Node)) {
        setMostrarEstudiantes(false);
      }
      funcionarioInputRefs.current.forEach((ref, idx) => {
        if (ref && !ref.contains(e.target as Node)) {
          setFuncionarioSugerencias(prev => {
            const nuevo = new Map(prev);
            nuevo.set(idx, []);
            return nuevo;
          });
        }
      });
      setMostrarFuncionarios(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function validarPaso(): string | null {
    if (paso === 0) {
      if (!estudiante.rut.trim()) {
        return "Ingresa el RUT del estudiante.";
      }
      if (!validarRut(estudiante.rut)) {
        return "El RUT ingresado no es válido.";
      }
      if (!estudianteEncontrado || !estudiante.nombre.trim() || !estudiante.curso.trim()) {
        return "El estudiante debe estar registrado. Agrégalo primero en Estudiantes.";
      }
    }
    if (paso === 1) {
      const validos = funcionarios.filter((item) => item.encontrado && item.nombre.trim() && item.cargo.trim());
      if (validos.length === 0) {
        return "Debe haber al menos un funcionario registrado. Agrégalo primero en Funcionarios.";
      }
      if (funcionarios.some((item) => (item.rut || "").trim() && !item.encontrado)) {
        return "Cada RUT debe coincidir con un funcionario del catálogo.";
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
        funcionarios_presentes: funcionarios
          .filter((item) => item.encontrado && item.nombre.trim() && item.cargo.trim())
          .map((item) => ({
            rut: item.rut || "",
            nombre: item.nombre,
            cargo: item.cargo,
          })),
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
      <div className="intro">
        <p className="eyebrow">Nueva revisión</p>
        <h1>Registrar un procedimiento</h1>
        <p>Completa los antecedentes del procedimiento, paso a paso.</p>
      </div>
      <ol className="pasos">
        {PASOS.map((nombre, indice) => (
          <li key={nombre} className={indice === paso ? "activo" : indice < paso ? "hecho" : ""}>
            <b>{indice + 1}</b>
            {nombre}
          </li>
        ))}
      </ol>

      {paso === 0 && (
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Estudiante involucrado</h2>
              <p>Comienza por identificar al estudiante.</p>
            </div>
            <span className="badge blue">Paso 1 de 6</span>
          </div>
          <div className="form-grid">
          <label>
            RUT
            <div style={{ position: "relative" }}>
              <input
                ref={estudianteInputRef}
                value={estudiante.rut}
                onChange={(e) => {
                  setEstudiante({ rut: e.target.value, nombre: "", curso: "" });
                  setEstudianteEncontrado(false);
                  setError(null);
                }}
                onFocus={() => estudiante.rut.trim().length >= 3 && setMostrarEstudiantes(true)}
                placeholder="12.345.678-5"
                maxLength={RUT_MAX_LENGTH}
                autoComplete="off"
              />
              {mostrarEstudiantes && estudianteSugerencias.length > 0 && (
                <ul className="autocomplete-dropdown" role="listbox">
                  {estudianteSugerencias.map((est) => (
                    <li
                      key={est.id}
                      role="option"
                      onClick={() => seleccionarEstudiante(est)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <strong>{est.rut}</strong> — {est.nombre} <span className="ayuda">({est.curso})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>
          <label>
            Nombre completo
            <input
              value={estudiante.nombre}
              readOnly
              placeholder={buscandoEstudiante ? "Buscando…" : "Se completa con el RUT"}
            />
          </label>
          <label>
            Curso
            <input
              value={estudiante.curso}
              readOnly
              placeholder={buscandoEstudiante ? "Buscando…" : "Se completa con el RUT"}
            />
          </label>
          </div>
          <div className="note">
            El nombre y el curso se completan si el estudiante está en el catálogo.{" "}
            <Link className="text-btn" to="/catalogos/estudiantes">
              Ver estudiantes →
            </Link>
          </div>
        </section>
      )}

      {paso === 1 && (
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Funcionarios presentes</h2>
              <p>Ingresa el RUT. Nombre y cargo se completan desde el catálogo.</p>
            </div>
            <span className="badge blue">Paso 2 de 6</span>
          </div>
          <div className="note">
            Cada funcionario debe existir en el catálogo.{" "}
            <Link className="text-btn" to="/catalogos/funcionarios">
              Ver funcionarios →
            </Link>
          </div>
          {funcionarios.map((item, indice) => (
            <div className="fila-dinamica" key={indice}>
              <label>
                RUT
                <div style={{ position: "relative" }}>
                  <input
                    ref={(el) => { funcionarioInputRefs.current[indice] = el; }}
                    value={item.rut || ""}
                    onChange={(e) => {
                      const rut = e.target.value;
                      const copia = [...funcionarios];
                      copia[indice] = { rut, nombre: "", cargo: "", encontrado: false };
                      setFuncionarios(copia);
                      setError(null);
                      buscarFuncionarios(indice, rut);
                    }}
                    onFocus={() => (item.rut || "").trim().length >= 3 && setMostrarFuncionarios(indice)}
                    placeholder="12.345.678-5"
                    maxLength={RUT_MAX_LENGTH}
                    autoComplete="off"
                  />
                  {mostrarFuncionarios === indice && (funcionarioSugerencias.get(indice) || []).length > 0 && (
                    <ul className="autocomplete-dropdown" role="listbox">
                      {(funcionarioSugerencias.get(indice) || []).map((func) => (
                        <li
                          key={func.id}
                          role="option"
                          onClick={() => seleccionarFuncionario(indice, func)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <strong>{func.rut}</strong> — {func.nombre} <span className="ayuda">({func.cargo})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </label>
              <label>
                Nombre
                <input
                  value={item.nombre}
                  readOnly
                  placeholder={buscandoFuncionario === indice ? "Buscando…" : "Se completa con el RUT"}
                />
              </label>
              <label>
                Cargo / rol en la revisión
                <input
                  value={item.cargo}
                  readOnly
                  placeholder={buscandoFuncionario === indice ? "Buscando…" : "Se completa con el RUT"}
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
          <div className="card-head">
            <div>
              <h2>Motivo y elementos encontrados</h2>
              <p>Describe el fundamento y, si corresponde, lo hallado.</p>
            </div>
            <span className="badge blue">Paso 3 de 6</span>
          </div>
          <label>
            Motivo de la revisión
            <textarea
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Indica el fundamento del procedimiento."
              maxLength={1000}
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
                  max={999}
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
                  maxLength={300}
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
                  maxLength={500}
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
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Fecha y horarios del procedimiento</h2>
              <p>Indica cuándo se realizó la revisión.</p>
            </div>
            <span className="badge blue">Paso 4 de 6</span>
          </div>
          <div className="form-grid">
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
          </div>
        </section>
      )}

      {paso === 4 && (
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Evidencia fotográfica</h2>
              <p>Opcional. JPG, PNG o WEBP. Máximo 5 MB por archivo.</p>
            </div>
            <span className="badge blue">Paso 5 de 6</span>
          </div>
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
          <div className="card-head">
            <div>
              <h2>Confirmar registro</h2>
              <p>Revisa los antecedentes antes de guardar.</p>
            </div>
            <span className="badge blue">Paso 6 de 6</span>
          </div>
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
