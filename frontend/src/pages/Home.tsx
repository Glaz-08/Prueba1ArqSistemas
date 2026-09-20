import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSalud, listarRegistros } from "../api/registros";
import type { HealthResponse } from "../api/client";
import type { RegistroResumen } from "../types";

function formatoHora(valor: string): string {
  return valor.slice(0, 5);
}

export default function Home() {
  const [api, setApi] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registros, setRegistros] = useState<RegistroResumen[]>([]);

  useEffect(() => {
    getSalud()
      .then(setApi)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error de conexión");
      });
    listarRegistros()
      .then((data) => setRegistros(data.items))
      .catch(() => setRegistros([]));
  }, []);

  return (
    <main className="layout">
      <header className="hero">
        <p className="eyebrow">Ley 21.827</p>
        <h1>Registro de revisiones de pertenencias</h1>
        <p className="lead">
          Formaliza cada procedimiento: estudiante, funcionarios presentes,
          motivo, elementos encontrados, horarios y evidencia fotográfica.
        </p>
        <Link className="button" to="/registros/nueva">
          Registrar revisión
        </Link>
      </header>

      <section className="card">
        <h2>Estado de la API</h2>
        {error && <p className="error">{error}. Inicia el backend en el puerto 8000.</p>}
        {api && (
          <p className="ok">
            Conectada · {api.service} ({api.environment})
          </p>
        )}
      </section>

      <section className="card">
        <h2>Registros recientes</h2>
        {registros.length === 0 ? (
          <p>Aún no hay revisiones. El listado con filtros lo completará el equipo de consulta.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estudiante</th>
                <th>Curso</th>
                <th>Horario</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {registros.map((item) => (
                <tr key={item.id}>
                  <td>{item.fecha}</td>
                  <td>{item.estudiante_nombre}</td>
                  <td>{item.estudiante_curso}</td>
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
    </main>
  );
}
