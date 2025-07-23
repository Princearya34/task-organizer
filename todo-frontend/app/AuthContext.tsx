import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (response: AuthResponse) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getTokenExpiry(token: string | null): number | null {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp) {
      // JWT exp is in seconds
      return decoded.exp * 1000;
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    let expired = false;
    try {
      if (storedToken && storedUser && storedUser !== "undefined") {
        // Check expiry
        const expiry = getTokenExpiry(storedToken);
        if (expiry && Date.now() > expiry) {
          expired = true;
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } else {
        expired = true;
      }
    } catch {
      expired = true;
    }
    if (expired) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  // Automatically logout when token expires
  useEffect(() => {
    if (!token) return;
    const expiry = getTokenExpiry(token);
    if (!expiry) return;
    const timeout = expiry - Date.now();
    if (timeout > 0) {
      const timer = setTimeout(() => {
        logout();
      }, timeout);
      return () => clearTimeout(timer);
    } else {
      logout();
    }
  }, [token]);

  // Inactivity logout: logout after 15 minutes of no interaction
  useEffect(() => {
    if (!token) return;
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
      }, 15 * 60 * 1000); // 15 minutes
    };

    // Listen to user activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("mousedown", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    // Start the timer
    resetTimer();

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("mousedown", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      clearTimeout(timer);
    };
  }, [token]);

  const login = (authResponse: AuthResponse) => {
    setToken(authResponse.token);
    setUser(authResponse.user);
    localStorage.setItem("token", authResponse.token);
    localStorage.setItem("user", JSON.stringify(authResponse.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}