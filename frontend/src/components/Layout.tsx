import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { iniciales, tituloRuta } from "../utils/formato";

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function cerrarSesion() {
    await logout();
    navigate("/login", { replace: true });
  }

  if (!usuario) {
    return <Outlet />;
  }

  const crumb = tituloRuta(location.pathname);

  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <Link to="/" className="brand">
          <span className="brand-icon" aria-hidden>
            ▤
          </span>
          <span>
            <strong>Registro escolar</strong>
            <small>Revisiones de pertenencias</small>
          </span>
        </Link>
        <nav>
          <p className="caption">Procedimientos</p>
          <NavLink to="/" end>
            <span className="ico" aria-hidden>
              ⌂
            </span>
            Inicio
          </NavLink>
          <NavLink to="/registros/nueva">
            <span className="ico" aria-hidden>
              ⊕
            </span>
            Nueva revisión
          </NavLink>
          <NavLink to="/consulta">
            <span className="ico" aria-hidden>
              ⌕
            </span>
            Consulta
          </NavLink>
          <NavLink to="/estadisticas">
            <span className="ico" aria-hidden>
              ▥
            </span>
            Estadísticas
          </NavLink>
          <p className="caption">Comunidad escolar</p>
          <NavLink to="/catalogos/estudiantes">
            <span className="ico" aria-hidden>
              ♧
            </span>
            Estudiantes
          </NavLink>
          <NavLink to="/catalogos/funcionarios">
            <span className="ico" aria-hidden>
              ♙
            </span>
            Funcionarios
          </NavLink>
          {usuario.rol === "admin" && (
            <>
              <p className="caption">Administración</p>
              <NavLink to="/admin/usuarios">
                <span className="ico" aria-hidden>
                  ⚙
                </span>
                Usuarios
              </NavLink>
            </>
          )}
        </nav>
        <div className="aside-bottom">
          <strong>Un registro claro, paso a paso.</strong>
          Organiza los procedimientos y sus antecedentes en un mismo lugar.
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header no-print">
          <p className="breadcrumb">
            Registro de revisiones
            <span>/</span>
            {crumb}
          </p>
          <div className="profile">
            <span className="avatar">{iniciales(usuario.nombre || "AD")}</span>
            <div>
              <strong>{usuario.rol === "admin" ? "Administrador" : usuario.nombre}</strong>
              <small>{usuario.rol === "admin" ? "Gestión escolar" : usuario.cargo || "Funcionario"}</small>
            </div>
            <NavLink to="/contrasena" className="text-btn">
              Cambiar clave
            </NavLink>
            <button type="button" className="text-btn" onClick={() => void cerrarSesion()}>
              Salir
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
