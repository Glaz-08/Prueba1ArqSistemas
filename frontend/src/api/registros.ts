import type { HealthResponse } from "./client";
import type { Registro, RegistroCreate, RegistroResumen } from "../types";

export type { HealthResponse } from "./client";

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

export async function listarRegistros(): Promise<{ items: RegistroResumen[]; total: number }> {
  const response = await fetch("/api/registros");
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function obtenerRegistro(id: string): Promise<Registro> {
  const response = await fetch(`/api/registros/${id}`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function crearRegistro(payload: RegistroCreate): Promise<Registro> {
  const response = await fetch("/api/registros", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function adjuntarEvidencia(id: string, archivo: File): Promise<Registro> {
  const data = new FormData();
  data.append("archivo", archivo);
  const response = await fetch(`/api/registros/${id}/evidencias`, {
    method: "POST",
    body: data,
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export function urlEvidencia(registroId: string, evidenciaId: string): string {
  return `/api/registros/${registroId}/evidencias/${evidenciaId}`;
}

export async function descargarDocumentoHtml(id: string): Promise<void> {
  const response = await fetch(`/api/registros/${id}/documento.html`);
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
