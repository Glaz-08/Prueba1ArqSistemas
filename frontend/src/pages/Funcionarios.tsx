import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  actualizarFuncionario,
  crearFuncionario,
  eliminarFuncionario,
  listarFuncionarios,
} from "../api/catalogos";
import type { FuncionarioCatalogo } from "../types";
import { RUT_MAX_LENGTH, validarRut } from "../utils/rut";

const VACIO = { rut: "", nombre: "", cargo: "" };

export default function Funcionarios() {
  const [items, setItems] = useState<FuncionarioCatalogo[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function cargar(q?: string) {
    try {
      setItems(await listarFuncionarios(q));
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
    if (form.nombre.trim().length < 3 || form.cargo.trim().length < 2) {
      setError("Completa nombre y cargo.");
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarFuncionario(editandoId, { ...form, nombre: form.nombre.trim(), cargo: form.cargo.trim() });
      } else {
        await crearFuncionario({ ...form, nombre: form.nombre.trim(), cargo: form.cargo.trim() });
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
    if (!window.confirm("¿Eliminar este funcionario?")) {
      return;
    }
    try {
      await eliminarFuncionario(id);
      await cargar(busqueda);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  return (
    <main className="layout">
      <div className="intro">
        <p className="eyebrow">Comunidad escolar</p>
        <h1>Funcionarios</h1>
        <p>Mantén actualizado el catálogo de funcionarios del establecimiento.</p>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>{editandoId ? "Editar funcionario" : "Nuevo funcionario"}</h2>
        </div>
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
            Cargo
            <input
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              placeholder="Inspector general"
              maxLength={120}
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
        <div className="card-head">
          <h2>Listado de funcionarios</h2>
          <input
            className="search"
            placeholder="Buscar por nombre, RUT o cargo"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              void cargar(e.target.value);
            }}
          />
        </div>
        {items.length === 0 ? (
          <p>No hay funcionarios registrados.</p>
        ) : (
          <div className="table-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.rut}</td>
                  <td>{item.nombre}</td>
                  <td>
                    <span className="badge">{item.cargo}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => {
                        setForm({ rut: item.rut, nombre: item.nombre, cargo: item.cargo });
                        setEditandoId(item.id);
                      }}
                    >
                      Editar
                    </button>
                    <button type="button" className="text-btn danger" onClick={() => void eliminar(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>
    </main>
  );
}
