import { useEffect, useState } from "react";
import { getSalud, type HealthResponse } from "./api/client";

type ApiState =
  | { status: "cargando" }
  | { status: "ok"; data: HealthResponse }
  | { status: "error"; mensaje: string };

function App() {
  const [api, setApi] = useState<ApiState>({ status: "cargando" });

  useEffect(() => {
    getSalud()
      .then((data) => setApi({ status: "ok", data }))
      .catch((error: unknown) => {
        const mensaje =
          error instanceof Error ? error.message : "Error desconocido";
        setApi({ status: "error", mensaje });
      });
  }, []);

  return (
    <main className="layout">
      <header className="hero">
        <p className="eyebrow">Ley 21.827</p>
        <h1>Registro de revisiones de pertenencias</h1>
        <p className="lead">
          Sistema web para centralizar los procedimientos de revisión en
          establecimientos educacionales: estudiante, funcionarios presentes,
          motivo, elementos encontrados, horarios y evidencia.
        </p>
      </header>

      <section className="grid">
        <article className="card">
          <h2>Stack</h2>
          <ul>
            <li>
              <strong>Backend:</strong> Python + FastAPI
            </li>
            <li>
              <strong>Frontend:</strong> React + TypeScript
            </li>
            <li>
              <strong>API:</strong> REST
            </li>
          </ul>
        </article>

        <article className="card">
          <h2>Estado de la API</h2>
          {api.status === "cargando" && <p>Comprobando conexión…</p>}
          {api.status === "ok" && (
            <p className="ok">
              Conectada · {api.data.service} ({api.data.environment})
            </p>
          )}
          {api.status === "error" && (
            <p className="error">
              {api.mensaje}. Inicia el backend en el puerto 8000.
            </p>
          )}
        </article>

        <article className="card">
          <h2>Próximo paso</h2>
          <p>
            Esta base deja backend, frontend y API REST operativos. El MVP
            incorporará registro, consulta, documento imprimible y estadísticas.
          </p>
        </article>
      </section>
    </main>
  );
}

export default App;
