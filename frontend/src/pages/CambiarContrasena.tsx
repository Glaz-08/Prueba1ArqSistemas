import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { cambiarContrasena, solicitarResetContrasena, confirmarResetContrasena } from "../api/auth";
import { useAuth } from "../context/AuthContext";

type Modo = "cambiar" | "solicitar" | "confirmar";

export default function CambiarContrasena() {
  const navigate = useNavigate();
  const { usuario, cargando } = useAuth();
  const [modo, setModo] = useState<Modo>("cambiar");
  const [form, setForm] = useState({
    contrasena_actual: "",
    contrasena_nueva: "",
    confirmar_nueva: "",
    username: "",
    token: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!cargando && !usuario && modo !== "solicitar") {
    navigate("/login", { replace: true });
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setExito(null);

    if (modo === "cambiar") {
      if (!form.contrasena_actual || !form.contrasena_nueva || !form.confirmar_nueva) {
        setError("Completa todos los campos.");
        return;
      }
      if (form.contrasena_nueva !== form.confirmar_nueva) {
        setError("Las contraseñas nuevas no coinciden.");
        return;
      }
      if (form.contrasena_nueva.length < 6) {
        setError("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }
      setEnviando(true);
      try {
        await cambiarContrasena({ contrasena_actual: form.contrasena_actual, contrasena_nueva: form.contrasena_nueva });
        setExito("Contraseña cambiada correctamente. Vuelve a iniciar sesión con la nueva clave.");
        setForm({ ...form, contrasena_actual: "", contrasena_nueva: "", confirmar_nueva: "" });
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña");
      } finally {
        setEnviando(false);
      }
    } else if (modo === "solicitar") {
      if (!form.username.trim()) {
        setError("Ingresa tu username.");
        return;
      }
      setEnviando(true);
      try {
        const res = await solicitarResetContrasena({ username: form.username.trim().toLowerCase() });
        // En producción no se muestra el token; aquí sí para testing
        if (res.token) {
          setExito(`Token de reseteo (copie y guarde): ${res.token}`);
        } else {
          setExito("Si el usuario existe, se ha generado un token de reseteo.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "No se pudo solicitar el reseteo");
      } finally {
        setEnviando(false);
      }
    } else if (modo === "confirmar") {
      if (!form.token.trim() || !form.contrasena_nueva || !form.confirmar_nueva) {
        setError("Completa todos los campos.");
        return;
      }
      if (form.contrasena_nueva !== form.confirmar_nueva) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      if (form.contrasena_nueva.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      setEnviando(true);
      try {
        await confirmarResetContrasena({ token: form.token.trim(), contrasena_nueva: form.contrasena_nueva });
        setExito("Contraseña restablecida correctamente. Redirigiendo al login...");
        setForm({ ...form, token: "", contrasena_nueva: "", confirmar_nueva: "" });
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Token inválido o expirado");
      } finally {
        setEnviando(false);
      }
    }
  }

  return (
    <main className="layout">
      <section className="card login-card" style={{ maxWidth: "520px", margin: "2rem auto" }}>
        <div className="login-logo" aria-hidden>🔐</div>
        <h1>{modo === "cambiar" ? "Cambiar contraseña" : modo === "solicitar" ? "Restablecer contraseña" : "Confirmar nueva contraseña"}</h1>
        <p className="login-sub">
          {modo === "cambiar"
            ? "Ingresa tu clave actual y la nueva."
            : modo === "solicitar"
            ? "Ingresa tu username para recibir un token de reseteo."
            : "Ingresa el token recibido y tu nueva contraseña."}
        </p>

        <form onSubmit={(event) => void handleSubmit(event)}>
          {modo === "cambiar" && (
            <>
              <label>
                Contraseña actual
                <input
                  type="password"
                  value={form.contrasena_actual}
                  onChange={(e) => setForm({ ...form, contrasena_actual: e.target.value })}
                  autoComplete="current-password"
                  required
                />
              </label>
              <label>
                Nueva contraseña
                <input
                  type="password"
                  value={form.contrasena_nueva}
                  onChange={(e) => setForm({ ...form, contrasena_nueva: e.target.value })}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </label>
              <label>
                Confirmar nueva contraseña
                <input
                  type="password"
                  value={form.confirmar_nueva}
                  onChange={(e) => setForm({ ...form, confirmar_nueva: e.target.value })}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </label>
            </>
          )}

          {modo === "solicitar" && (
            <label>
              Username
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
                placeholder="tu-usuario"
                required
              />
            </label>
          )}

          {modo === "confirmar" && (
            <>
              <label>
                Token de reseteo
                <input
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                  placeholder="Pega aquí el token recibido"
                  required
                />
              </label>
              <label>
                Nueva contraseña
                <input
                  type="password"
                  value={form.contrasena_nueva}
                  onChange={(e) => setForm({ ...form, contrasena_nueva: e.target.value })}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </label>
              <label>
                Confirmar nueva contraseña
                <input
                  type="password"
                  value={form.confirmar_nueva}
                  onChange={(e) => setForm({ ...form, confirmar_nueva: e.target.value })}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </label>
            </>
          )}

          {error && <p className="error">{error}</p>}
          {exito && <p className="ok">{exito}</p>}

          <button className="button login-button" type="submit" disabled={enviando} style={{ marginTop: "0.5rem" }}>
            {enviando ? "Procesando…" : modo === "cambiar" ? "Cambiar contraseña" : modo === "solicitar" ? "Enviar token" : "Restablecer"}
          </button>
        </form>

        <div className="acciones" style={{ marginTop: "1.5rem", justifyContent: "center", gap: "1rem" }}>
          {modo !== "cambiar" && (
            <button type="button" className="button secondary" onClick={() => { setModo("cambiar"); setError(null); setExito(null); }}>
              Volver a cambiar contraseña
            </button>
          )}
          {modo === "cambiar" && usuario && (
            <button type="button" className="button secondary" onClick={() => { setModo("solicitar"); setError(null); setExito(null); }}>
              ¿Olvidé mi contraseña?
            </button>
          )}
          {modo === "solicitar" && (
            <button type="button" className="button secondary" onClick={() => { setModo("confirmar"); setError(null); setExito(null); }}>
              Tengo el token
            </button>
          )}
        </div>
      </section>
    </main>
  );
}