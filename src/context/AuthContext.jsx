import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem("gh_token"));
  const [user,  setUser]    = useState(() => {
    try {
      const stored = localStorage.getItem("gh_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const saveSession = (token, user) => {
    localStorage.setItem("gh_token", token);
    localStorage.setItem("gh_user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("gh_token");
    localStorage.removeItem("gh_user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem("gh_user", JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ token, user, saveSession, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
