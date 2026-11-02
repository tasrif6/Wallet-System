import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { auth } from "../services/api";
import { setSecret, clearSecret } from "../lib/sessionSecret";

const C = createContext(null);

function getTokenExpiration(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
    );
    return Number.isFinite(decoded.exp) ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [sessionExpired, setSessionExpired] = useState(false);

  const expireSession = useCallback(() => {
    localStorage.removeItem("token");
    clearSecret();
    setToken(null);
    setUser(null);
    setLoading(false);
    setSessionExpired(true);
  }, []);

  useEffect(() => {
    if (token) {
      const expiresAt = getTokenExpiration(token);
      if (expiresAt !== null && expiresAt <= Date.now()) {
        expireSession();
        return;
      }

      auth
        .me()
        .then((authenticatedUser) => {
          if (localStorage.getItem("token") === token)
            setUser(authenticatedUser);
        })
        .catch(() => {
          if (localStorage.getItem("token") === token) {
            localStorage.removeItem("token");
            clearSecret();
            setToken(null);
          }
        })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  useEffect(() => {
    if (!token) return;

    const expiresAt = getTokenExpiration(token);
    if (expiresAt === null) return;

    let timeout;
    const checkExpiration = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        expireSession();
        return;
      }

      timeout = window.setTimeout(
        checkExpiration,
        Math.min(remaining, 2_147_483_647),
      );
    };
    checkExpiration();

    return () => window.clearTimeout(timeout);
  }, [token, expireSession]);

  const startSession = async (accessToken, password) => {
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    setSessionExpired(false);
    setSecret(password);
    setUser(await auth.me());
  };
  const login = async (d) => {
    const r = await auth.login(d);
    await startSession(r.access_token, d.password);
  };
  const logout = () => {
    localStorage.removeItem("token");
    clearSecret();
    setToken(null);
    setUser(null);
  };
  const clearSessionExpired = () => setSessionExpired(false);

  return (
    <C.Provider
      value={{
        user,
        loading,
        login,
        startSession,
        logout,
        sessionExpired,
        clearSessionExpired,
      }}
    >
      {children}
    </C.Provider>
  );
}
export const useAuth = () => useContext(C);
