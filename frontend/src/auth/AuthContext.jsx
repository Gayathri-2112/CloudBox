import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // ✅ Restore user on page reload
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);

        setUser(decoded);
        setIsAuthenticated(true);
      } catch (err) {
        logout();
      }
    }
  }, []);

  // ✅ Login (used after authService)
  const login = (token) => {
    localStorage.setItem("token", token);

    const decoded = jwtDecode(token);

    localStorage.setItem("role", decoded.role);
    localStorage.setItem("email", decoded.sub);

    setUser(decoded);
    setIsAuthenticated(true);
  };

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};