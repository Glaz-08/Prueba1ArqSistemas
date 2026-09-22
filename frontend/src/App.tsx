import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CopiaImprimible from "./pages/CopiaImprimible";
import Consulta from "./pages/Consulta";
import DetalleRegistro from "./pages/DetalleRegistro";
import Estadisticas from "./pages/Estadisticas";
import Home from "./pages/Home";
import NuevaRevision from "./pages/NuevaRevision";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/registros/nueva" element={<NuevaRevision />} />
        <Route path="/consulta" element={<Consulta />} />
        <Route path="/estadisticas" element={<Estadisticas />} />
        <Route path="/registros/:id" element={<DetalleRegistro />} />
        <Route path="/registros/:id/copia" element={<CopiaImprimible />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
