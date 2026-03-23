import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, logoutUser, getMe } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        try {
          const res = await getMe();
          setUser(res.data.data);
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    const { user, token } = res.data.data;
    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
    return user;
  };

  const register = async (username, email, password) => {
    const res = await registerUser({ username, email, password });
    const { user, token } = res.data.data;
    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {}
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
