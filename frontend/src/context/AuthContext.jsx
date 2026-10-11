import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/api";
const C = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (localStorage.getItem("token"))
      auth
        .me()
        .then(setUser)
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    else setLoading(false);
  }, []);
  const login = async (d) => {
    const r = await auth.login(d);
    localStorage.setItem("token", r.access_token);
    setUser(await auth.me());
  };
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };
  return (
    <C.Provider value={{ user, loading, login, logout }}>{children}</C.Provider>
  );
}
export const useAuth = () => useContext(C);
