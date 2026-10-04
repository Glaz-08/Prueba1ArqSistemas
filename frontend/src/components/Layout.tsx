import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  async function cerrarSesion() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="page">
      <header className="topbar no-print">
        <Link to="/" className="brand">
          Registro de revisiones
        </Link>
        {usuario && (
          <nav>
            <NavLink to="/" end>
              Inicio
            </NavLink>
            <NavLink to="/registros/nueva">Nueva revisión</NavLink>
            <NavLink to="/consulta">Consulta</NavLink>
            <NavLink to="/estadisticas">Estadísticas</NavLink>
            <NavLink to="/catalogos/estudiantes">Estudiantes</NavLink>
            <NavLink to="/catalogos/funcionarios">Funcionarios</NavLink>
            {usuario.rol === "admin" && <NavLink to="/admin/usuarios">Usuarios</NavLink>}
          </nav>
        )}
        <div className="sesion">
          {usuario && (
            <>
              <span className="sesion-usuario">
                {usuario.rol === "admin" ? (
                  <strong>Administrador</strong>
                ) : (
                  <>
                    {usuario.cargo && <span className="sesion-cargo">{usuario.cargo}</span>}
                    <strong>{usuario.nombre}</strong>
                  </>
                )}
              </span>
              <NavLink to="/contrasena" className="button ghost" style={{ padding: "0.4rem 0.6rem" }}>
                Cambiar clave
              </NavLink>
              <button type="button" className="button ghost" onClick={() => void cerrarSesion()}>
                Salir
              </button>
            </>
          )}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
