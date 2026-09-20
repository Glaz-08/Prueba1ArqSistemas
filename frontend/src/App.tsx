import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CopiaImprimible from "./pages/CopiaImprimible";
import DetalleRegistro from "./pages/DetalleRegistro";
import Home from "./pages/Home";
import NuevaRevision from "./pages/NuevaRevision";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/registros/nueva" element={<NuevaRevision />} />
        <Route path="/registros/:id" element={<DetalleRegistro />} />
        <Route path="/registros/:id/copia" element={<CopiaImprimible />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
