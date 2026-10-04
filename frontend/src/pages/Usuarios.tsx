import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  actualizarUsuario,
  resetearContrasenaUsuario,
} from "../api/auth";
import type { Usuario } from "../api/auth";

const VACIO = { nombre: "", username: "", password: "", rol: "funcionario" as const, cargo: "" };

export default function Usuarios() {
  const [items, setItems] = useState<Usuario[]>([]);
  const [form, setForm] = useState<{ nombre: string; username: string; password: string; rol: "admin" | "funcionario"; cargo: string }>(VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [reseteandoId, setReseteandoId] = useState<string | null>(null);
  const [mostrarContrasenaTemporal, setMostrarContrasenaTemporal] = useState<string | null>(null);

  async function cargar() {
    try {
      const data = await listarUsuarios();
      setItems(data);
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
    setExito(null);
    if (form.nombre.trim().length < 3 || form.username.trim().length < 3) {
      setError("Completa nombre y username.");
      return;
    }
    if (!editandoId && !form.cargo) {
      // cargo es opcional
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarUsuario(editandoId, form);
        setExito("Usuario actualizado correctamente");
      } else {
        await crearUsuario(form);
        setExito("Usuario creado correctamente");
      }
      setForm(VACIO);
      setEditandoId(null);
      await cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: string) {
    if (!window.confirm("¿Eliminar este usuario? No podrás deshacer esta acción.")) {
      return;
    }
    setEliminandoId(id);
    try {
      await eliminarUsuario(id);
      await cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setEliminandoId(null);
    }
  }

  async function resetearContrasena(id: string) {
    if (!window.confirm("¿Generar nueva contraseña temporal para este usuario?")) {
      return;
    }
    setReseteandoId(id);
    try {
      const usuario = await resetearContrasenaUsuario(id);
      // La contraseña temporal viene en el campo cargo del response (workaround)
      setMostrarContrasenaTemporal(usuario.cargo);
      setExito(`Contraseña temporal generada: ${usuario.cargo} (copie y entregue al usuario)`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo resetear");
    } finally {
      setReseteandoId(null);
    }
  }

  function editar(usuario: Usuario) {
    setForm({
      nombre: usuario.nombre,
      username: usuario.username,
      password: "",
      rol: usuario.rol,
      cargo: usuario.cargo,
    });
    setEditandoId(usuario.id);
  }

  function cancelar() {
    setForm(VACIO);
    setEditandoId(null);
    setMostrarContrasenaTemporal(null);
  }

  return (
    <main className="layout">
      <div className="intro">
        <p className="eyebrow">Administración</p>
        <h1>Gestión de usuarios</h1>
        <p>Administra los accesos del equipo escolar.</p>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>{editandoId ? "Editar usuario" : "Nuevo usuario"}</h2>
          <span className="badge yellow">Solo administradores</span>
        </div>
        <form onSubmit={(event) => void guardar(event)} className="form-grid">
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
            Username
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              maxLength={80}
              required
              disabled={editandoId !== null}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              maxLength={200}
              required={!editandoId}
              disabled={editandoId !== null}
              placeholder={editandoId ? "Déjalo vacío para no cambiarla" : "Mínimo 6 caracteres"}
            />
          </label>
          <label>
            Rol
            <select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value as "admin" | "funcionario" })}
              required
              disabled={editandoId !== null}
            >
              <option value="funcionario">Funcionario</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <label>
            Cargo (opcional)
            <input
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              placeholder="Inspector general"
              maxLength={120}
            />
          </label>
          <div className="acciones">
            <button className="button" type="submit" disabled={guardando}>
              {editandoId ? "Guardar cambios" : "Crear usuario"}
            </button>
            {editandoId && (
              <button type="button" className="button secondary" onClick={cancelar}>
                Cancelar
              </button>
            )}
          </div>
        </form>
        {error && <p className="error">{error}</p>}
        {exito && <p className="ok">{exito}</p>}
        {mostrarContrasenaTemporal && (
          <div className="card" style={{ marginTop: "1rem", borderColor: "#1d4ed8" }}>
            <strong>Contraseña temporal generada:</strong>
            <code style={{ display: "block", marginTop: "0.5rem", padding: "0.5rem", background: "#f1f5f9", borderRadius: "4px" }}>
              {mostrarContrasenaTemporal}
            </code>
            <p className="ayuda" style={{ marginTop: "0.5rem" }}>
              Entregue esta contraseña al usuario de forma segura. Deberá cambiarla en su primer ingreso.
            </p>
            <button type="button" className="button secondary" onClick={() => setMostrarContrasenaTemporal(null)}>
              Ocultar
            </button>
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Usuarios del sistema</h2>
          <span className="badge blue">{items.length} {items.length === 1 ? "usuario" : "usuarios"}</span>
        </div>
        {items.length === 0 ? (
          <p>No hay usuarios registrados.</p>
        ) : (
          <div className="table-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Username</th>
                <th>Rol</th>
                <th>Cargo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.nombre}</td>
                  <td>{item.username}</td>
                  <td>
                    <span className={`badge ${item.rol === "admin" ? "badge-admin" : "badge-funcionario"}`}>
                      {item.rol === "admin" ? "Administrador" : "Funcionario"}
                    </span>
                  </td>
                  <td>{item.cargo || "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => editar(item)}
                      disabled={eliminandoId === item.id || reseteandoId === item.id}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => resetearContrasena(item.id)}
                      disabled={eliminandoId === item.id || reseteandoId === item.id}
                    >
                      Resetear clave
                    </button>
                    <button
                      type="button"
                      className="text-btn danger"
                      onClick={() => eliminar(item.id)}
                      disabled={eliminandoId === item.id || reseteandoId === item.id || item.rol === "admin"}
                    >
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