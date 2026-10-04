import type { HealthResponse } from "./client";
import { getToken, limpiarSesion } from "./auth";
import type {
  Estadisticas,
  FiltrosConsulta,
  Registro,
  RegistroCreate,
  RegistroResumen,
} from "../types";

export type { HealthResponse } from "./client";

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function manejarRespuesta(response: Response): Promise<Response> {
  if (response.status === 401) {
    limpiarSesion();
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }
  return response;
}

async function parseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  if (body && typeof body.detail === "string") {
    return body.detail;
  }
  if (body && Array.isArray(body.detail) && body.detail[0]?.msg) {
    return body.detail[0].msg;
  }
  return "No fue posible completar la operación";
}

export async function getSalud(): Promise<HealthResponse> {
  const response = await fetch("/api/salud");
  if (!response.ok) {
    throw new Error("No fue posible conectar con la API");
  }
  return response.json();
}

export async function listarRegistros(
  filtros: FiltrosConsulta = {},
): Promise<{ items: RegistroResumen[]; total: number }> {
  const params = new URLSearchParams();
  if (filtros.estudiante) params.set("estudiante", filtros.estudiante);
  if (filtros.curso) params.set("curso", filtros.curso);
  if (filtros.motivo) params.set("motivo", filtros.motivo);
  if (filtros.fechaDesde) params.set("fecha_desde", filtros.fechaDesde);
  if (filtros.fechaHasta) params.set("fecha_hasta", filtros.fechaHasta);
  const query = params.toString();

  const response = await manejarRespuesta(
    await fetch(`/api/registros${query ? `?${query}` : ""}`, { headers: authHeaders() }),
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function obtenerEstadisticas(): Promise<Estadisticas> {
  const response = await manejarRespuesta(
    await fetch("/api/estadisticas", { headers: authHeaders() }),
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function obtenerRegistro(id: string): Promise<Registro> {
  const response = await manejarRespuesta(
    await fetch(`/api/registros/${id}`, { headers: authHeaders() }),
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function crearRegistro(payload: RegistroCreate): Promise<Registro> {
  const response = await manejarRespuesta(
    await fetch("/api/registros", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    }),
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function adjuntarEvidencia(id: string, archivo: File): Promise<Registro> {
  const data = new FormData();
  data.append("archivo", archivo);
  const response = await manejarRespuesta(
    await fetch(`/api/registros/${id}/evidencias`, {
      method: "POST",
      headers: authHeaders(),
      body: data,
    }),
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function urlEvidencia(registroId: string, evidenciaId: string): Promise<string> {
  const response = await manejarRespuesta(
    await fetch(`/api/registros/${registroId}/evidencias/${evidenciaId}`, {
      headers: authHeaders(),
    }),
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function descargarDocumentoHtml(id: string): Promise<void> {
  const response = await manejarRespuesta(
    await fetch(`/api/registros/${id}/documento.html`, { headers: authHeaders() }),
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `copia-revision-${id.slice(0, 8)}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportarConsultaPdf(filtros: FiltrosConsulta = {}): Promise<void> {
  const params = new URLSearchParams();
  if (filtros.estudiante) params.set("estudiante", filtros.estudiante);
  if (filtros.curso) params.set("curso", filtros.curso);
  if (filtros.motivo) params.set("motivo", filtros.motivo);
  if (filtros.fechaDesde) params.set("fecha_desde", filtros.fechaDesde);
  if (filtros.fechaHasta) params.set("fecha_hasta", filtros.fechaHasta);
  const query = params.toString();

  const response = await manejarRespuesta(
    await fetch(`/api/registros/exportar/pdf${query ? `?${query}` : ""}`, { headers: authHeaders() }),
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "consulta-revisiones.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
