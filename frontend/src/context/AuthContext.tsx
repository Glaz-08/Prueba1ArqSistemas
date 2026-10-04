import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getToken, limpiarSesion, login as apiLogin, logout as apiLogout, me } from "../api/auth";
import type { Usuario } from "../api/auth";

type AuthContextValue = {
  usuario: Usuario | null;
  cargando: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setCargando(false);
      return;
    }
    me()
      .then(setUsuario)
      .catch(() => limpiarSesion())
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const sesion = await apiLogin(username, password);
    setUsuario(sesion.usuario);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
