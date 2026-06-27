import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/apiInterceptor";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser)); 
    }
    setLoading(false);
  }, [])
  

  const loginWithGoogle = async (tokenId) => {
    try {
      const response = await api.post("/api/auth/google", { tokenId });
      const { user: userData } = response.data;

      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Google Authentication failed",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("api/auth/logout");
    } catch (error) {
      console.error("Logout failed on server", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
