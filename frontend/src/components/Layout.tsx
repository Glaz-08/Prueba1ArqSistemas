import { Link, NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="page">
      <header className="topbar no-print">
        <Link to="/" className="brand">
          Registro de revisiones
        </Link>
        <nav>
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/registros/nueva">Nueva revisión</NavLink>
          <NavLink to="/consulta">Consulta</NavLink>
          <NavLink to="/estadisticas">Estadísticas</NavLink>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
