import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  actualizarEstudiante,
  crearEstudiante,
  eliminarEstudiante,
  listarEstudiantes,
} from "../api/catalogos";
import type { EstudianteCatalogo } from "../types";
import { RUT_MAX_LENGTH, validarRut } from "../utils/rut";

const VACIO = { rut: "", nombre: "", curso: "" };

export default function Estudiantes() {
  const [items, setItems] = useState<EstudianteCatalogo[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function cargar(q?: string) {
    try {
      setItems(await listarEstudiantes(q));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo cargar");
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!validarRut(form.rut)) {
      setError("El RUT ingresado no es válido.");
      return;
    }
    if (form.nombre.trim().length < 3 || !form.curso.trim()) {
      setError("Completa nombre y curso.");
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarEstudiante(editandoId, { ...form, nombre: form.nombre.trim(), curso: form.curso.trim() });
      } else {
        await crearEstudiante({ ...form, nombre: form.nombre.trim(), curso: form.curso.trim() });
      }
      setForm(VACIO);
      setEditandoId(null);
      await cargar(busqueda);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: string) {
    if (!window.confirm("¿Eliminar este estudiante?")) {
      return;
    }
    try {
      await eliminarEstudiante(id);
      await cargar(busqueda);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  return (
    <main className="layout">
      <p className="eyebrow">Catálogo</p>
      <h1>Estudiantes</h1>

      <section className="card">
        <h2>{editandoId ? "Editar estudiante" : "Nuevo estudiante"}</h2>
        <form onSubmit={(event) => void guardar(event)} className="form-grid">
          <label>
            RUT
            <input
              value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })}
              placeholder="12.345.678-5"
              maxLength={RUT_MAX_LENGTH}
              disabled={editandoId !== null}
              required
            />
          </label>
          <label>
            Nombre
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              maxLength={200}
              required
            />
          </label>
          <label>
            Curso
            <input
              value={form.curso}
              onChange={(e) => setForm({ ...form, curso: e.target.value })}
              placeholder="2° medio A"
              maxLength={50}
              required
            />
          </label>
          <div className="acciones">
            <button className="button" type="submit" disabled={guardando}>
              {editandoId ? "Guardar cambios" : "Agregar"}
            </button>
            {editandoId && (
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setForm(VACIO);
                  setEditandoId(null);
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <div className="seccion-titulo">
          <h2>Listado</h2>
          <input
            placeholder="Buscar por nombre, RUT o curso"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              void cargar(e.target.value);
            }}
          />
        </div>
        {items.length === 0 ? (
          <p>No hay estudiantes registrados.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Curso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.rut}</td>
                  <td>{item.nombre}</td>
                  <td>{item.curso}</td>
                  <td>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        setForm({ rut: item.rut, nombre: item.nombre, curso: item.curso });
                        setEditandoId(item.id);
                      }}
                    >
                      Editar
                    </button>{" "}
                    <button type="button" className="button ghost" onClick={() => void eliminar(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
