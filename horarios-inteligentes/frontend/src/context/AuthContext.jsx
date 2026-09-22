import React, { createContext, useState, useContext, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("umg_user");
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("umg_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("umg_user");
    }
  }, [user]);

  const login = async (loginData) => {
    const res = await api.login(loginData);
    if (res && res.usuario) {
      setUser(res.usuario);
      return res.usuario;
    }
    throw new Error("No se pudo iniciar sesión.");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("umg_user");
  };

  const role = user?.rol || "guest";
  const isAdmin = role === "admin";
  const isDocente = role === "docente";

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, isDocente, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
