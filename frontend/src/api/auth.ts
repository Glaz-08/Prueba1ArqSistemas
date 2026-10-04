export type Usuario = {
  id: string;
  nombre: string;
  username: string;
  rol: "admin" | "funcionario";
  cargo: string;
};

export type Sesion = {
  access_token: string;
  token_type: string;
  usuario: Usuario;
};

const TOKEN_KEY = "registro_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function guardarSesion(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function limpiarSesion(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function parseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  if (body && typeof body.detail === "string") {
    return body.detail;
  }
  return "No fue posible completar la operación";
}

export async function login(username: string, password: string): Promise<Sesion> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const sesion = (await response.json()) as Sesion;
  guardarSesion(sesion.access_token);
  return sesion;
}

export async function logout(): Promise<void> {
  const token = getToken();
  try {
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } finally {
    limpiarSesion();
  }
}

export async function me(): Promise<Usuario> {
  const token = getToken();
  const response = await fetch("/api/auth/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const token = getToken();
  const response = await fetch("/api/auth/usuarios", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function actualizarUsuario(id: string, payload: { nombre: string; username: string; rol: string; cargo: string }): Promise<Usuario> {
  const token = getToken();
  const response = await fetch(`/api/auth/usuarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function eliminarUsuario(id: string): Promise<void> {
  const token = getToken();
  const response = await fetch(`/api/auth/usuarios/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function crearUsuario(payload: { nombre: string; username: string; password: string; rol: string; cargo: string }): Promise<Usuario> {
  const token = getToken();
  const response = await fetch("/api/auth/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function resetearContrasenaUsuario(id: string): Promise<Usuario> {
  const token = getToken();
  const response = await fetch(`/api/auth/usuarios/${id}/reset-contrasena`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function cambiarContrasena(payload: { contrasena_actual: string; contrasena_nueva: string }): Promise<void> {
  const token = getToken();
  const response = await fetch("/api/auth/cambiar-contrasena", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function solicitarResetContrasena(payload: { username: string }): Promise<{ mensaje: string; token?: string }> {
  const response = await fetch("/api/auth/reset-contrasena", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function confirmarResetContrasena(payload: { token: string; contrasena_nueva: string }): Promise<void> {
  const response = await fetch("/api/auth/reset-contrasena/confirmar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}
