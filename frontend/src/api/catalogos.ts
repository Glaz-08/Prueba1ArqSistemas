import { getToken, limpiarSesion } from "./auth";
import type { EstudianteCatalogo, FuncionarioCatalogo } from "../types";

function headers(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
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

async function llamada(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, { ...init, headers: headers(init?.headers as Record<string, string>) });
  if (response.status === 401) {
    limpiarSesion();
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }
  return response;
}

// Estudiantes
export async function obtenerEstudiantePorRut(rut: string): Promise<EstudianteCatalogo> {
  const response = await llamada(`/api/estudiantes/por-rut?rut=${encodeURIComponent(rut)}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function listarEstudiantes(q?: string): Promise<EstudianteCatalogo[]> {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  const response = await llamada(`/api/estudiantes${query}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function crearEstudiante(payload: Omit<EstudianteCatalogo, "id">): Promise<EstudianteCatalogo> {
  const response = await llamada("/api/estudiantes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function actualizarEstudiante(
  id: string,
  payload: Omit<EstudianteCatalogo, "id">,
): Promise<EstudianteCatalogo> {
  const response = await llamada(`/api/estudiantes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function eliminarEstudiante(id: string): Promise<void> {
  const response = await llamada(`/api/estudiantes/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await parseError(response));
}

// Funcionarios
export async function obtenerFuncionarioPorRut(rut: string): Promise<FuncionarioCatalogo> {
  const response = await llamada(`/api/funcionarios/por-rut?rut=${encodeURIComponent(rut)}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function listarFuncionarios(q?: string): Promise<FuncionarioCatalogo[]> {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  const response = await llamada(`/api/funcionarios${query}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function crearFuncionario(payload: Omit<FuncionarioCatalogo, "id">): Promise<FuncionarioCatalogo> {
  const response = await llamada("/api/funcionarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function actualizarFuncionario(
  id: string,
  payload: Omit<FuncionarioCatalogo, "id">,
): Promise<FuncionarioCatalogo> {
  const response = await llamada(`/api/funcionarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function eliminarFuncionario(id: string): Promise<void> {
  const response = await llamada(`/api/funcionarios/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await parseError(response));
}
