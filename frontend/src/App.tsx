import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import { AuthProvider } from "./context/AuthContext";
import CambiarContrasena from "./pages/CambiarContrasena";
import CopiaImprimible from "./pages/CopiaImprimible";
import Consulta from "./pages/Consulta";
import DetalleRegistro from "./pages/DetalleRegistro";
import Estadisticas from "./pages/Estadisticas";
import Estudiantes from "./pages/Estudiantes";
import Funcionarios from "./pages/Funcionarios";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NuevaRevision from "./pages/NuevaRevision";
import Usuarios from "./pages/Usuarios";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/contrasena" element={<CambiarContrasena />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/registros/nueva" element={<RequireAuth><NuevaRevision /></RequireAuth>} />
          <Route path="/consulta" element={<RequireAuth><Consulta /></RequireAuth>} />
          <Route path="/estadisticas" element={<RequireAuth><Estadisticas /></RequireAuth>} />
          <Route path="/catalogos/estudiantes" element={<RequireAuth><Estudiantes /></RequireAuth>} />
          <Route path="/catalogos/funcionarios" element={<RequireAuth><Funcionarios /></RequireAuth>} />
          <Route path="/admin/usuarios" element={<RequireAuth><Usuarios /></RequireAuth>} />
          <Route path="/registros/:id" element={<RequireAuth><DetalleRegistro /></RequireAuth>} />
          <Route path="/registros/:id/copia" element={<RequireAuth><CopiaImprimible /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
