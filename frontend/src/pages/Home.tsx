import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarEstudiantes, listarFuncionarios } from "../api/catalogos";
import { listarRegistros } from "../api/registros";
import type { RegistroResumen } from "../types";
import { formatoFecha, formatoHora, iniciales } from "../utils/formato";

export default function Home() {
  const [registros, setRegistros] = useState<RegistroResumen[]>([]);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [totalFuncionarios, setTotalFuncionarios] = useState(0);

  useEffect(() => {
    listarRegistros()
      .then((data) => setRegistros(data.items))
      .catch(() => setRegistros([]));
    listarEstudiantes()
      .then((items) => setTotalEstudiantes(items.length))
      .catch(() => setTotalEstudiantes(0));
    listarFuncionarios()
      .then((items) => setTotalFuncionarios(items.length))
      .catch(() => setTotalFuncionarios(0));
  }, []);

  return (
    <main className="layout">
      <header className="hero">
        <div>
          <p className="eyebrow">Comunidad escolar · Ley 21.827</p>
          <h1>
            Cada procedimiento,
            <br />
            bien registrado.
          </h1>
          <p>
            Registra las revisiones de pertenencias y mantén sus antecedentes
            organizados, desde el inicio hasta la evidencia.
          </p>
          <Link className="button" to="/registros/nueva">
            Registrar revisión <span>↗</span>
          </Link>
        </div>
        <svg
          className="hero-art"
          viewBox="0 0 280 220"
          role="img"
          aria-label="Ilustración de libros, un cuaderno y lápices"
        >
          <ellipse cx="140" cy="193" rx="116" ry="12" fill="#d7e2f4" />
          <rect x="36" y="163" width="155" height="26" rx="5" fill="#91af9e" />
          <path d="M48 169h137v13H48" fill="#f9faf4" />
          <path d="M48 173h132m-132 5h132" stroke="#d5dfd5" />
          <rect x="51" y="135" width="153" height="25" rx="4" fill="#e4b69f" />
          <path d="M61 141h137v12H61" fill="#fff7ec" />
          <rect x="39" y="108" width="143" height="25" rx="4" fill="#7d9dce" />
          <path d="M49 114h128v12H49" fill="#faf9f0" />
          <g transform="rotate(-12 128 95)">
            <rect x="83" y="37" width="90" height="94" rx="6" fill="#fbf5dd" stroke="#d7cda8" />
            <path d="M98 38v92" stroke="#d9baab" />
            <path d="M108 62h51m-51 13h51m-51 13h51m-51 13h39" stroke="#c3d0db" />
            <path
              d="M83 50h10m-10 16h10m-10 16h10m-10 16h10m-10 16h10"
              stroke="#7f91a7"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          <path d="M212 121l-9-67 8-1 9 67" fill="#e2b475" />
          <path d="M226 121l12-77 8 2-12 77" fill="#8fad9d" />
          <path d="M223 120l-1-86h8l1 86" fill="#93acd3" />
          <path d="M206 122h37l-5 65h-27z" fill="#e8c8b8" />
          <path d="M218 132v43m12-43v43" stroke="#d5b4a5" strokeWidth="2" />
          <circle cx="43" cy="57" r="4" fill="#a8bdac" />
          <path d="M248 84v10m-5-5h10" stroke="#a4b9da" strokeWidth="2" />
        </svg>
      </header>

      <section className="stats">
        <div className="stat">
          <span className="stat-icon" aria-hidden>
            ▤
          </span>
          <div>
            <strong>{registros.length}</strong>
            <small>{registros.length === 1 ? "Revisión registrada" : "Revisiones registradas"}</small>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon" aria-hidden>
            ♧
          </span>
          <div>
            <strong>{totalEstudiantes}</strong>
            <small>{totalEstudiantes === 1 ? "Estudiante en catálogo" : "Estudiantes en catálogo"}</small>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon" aria-hidden>
            ♙
          </span>
          <div>
            <strong>{totalFuncionarios}</strong>
            <small>{totalFuncionarios === 1 ? "Funcionario en catálogo" : "Funcionarios en catálogo"}</small>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Registros recientes</h2>
            <p>Los últimos procedimientos registrados.</p>
          </div>
          <Link className="text-btn" to="/consulta">
            Ver todos →
          </Link>
        </div>
        {registros.length === 0 ? (
          <p>Aún no hay revisiones. El listado con filtros lo completará el equipo de consulta.</p>
        ) : (
          <div className="table-wrap">
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
                {registros.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td>{formatoFecha(item.fecha)}</td>
                    <td>
                      <div className="student">
                        <span className="initial">{iniciales(item.estudiante_nombre)}</span>
                        <strong>{item.estudiante_nombre}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="badge blue">{item.estudiante_curso}</span>
                    </td>
                    <td>
                      {formatoHora(item.hora_inicio)} – {formatoHora(item.hora_termino)}
                    </td>
                    <td>
                      <Link className="text-btn" to={`/registros/${item.id}`}>
                        Ver detalle ↗
                      </Link>
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
