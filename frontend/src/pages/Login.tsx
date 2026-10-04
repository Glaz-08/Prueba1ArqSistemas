import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, usuario, cargando } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const destino = (location.state as { from?: string } | null)?.from ?? "/";

  if (!cargando && usuario) {
    return <Navigate to={destino} replace />;
  }

  async function ingresar(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(username.trim(), password);
      navigate(destino, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo" aria-hidden>
          🏫
        </div>
        <h1>Bienvenido</h1>
        <p className="login-sub">Registro de Revisiones</p>
        <form onSubmit={(event) => void ingresar(event)}>
          <label>
            Usuario
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="admin"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="button login-button" type="submit" disabled={enviando}>
            {enviando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        
      </section>
    </main>
  );
}
