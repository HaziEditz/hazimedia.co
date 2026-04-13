import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetMe, User, setAuthTokenGetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem("hazi_token"));

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("hazi_token"));
  }, []);

  const { data: user, isLoading: isUserLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError]);

  const login = (newToken: string) => {
    localStorage.setItem("hazi_token", newToken);
    setToken(newToken);
    setAuthTokenGetter(() => newToken);
  };

  const logout = () => {
    localStorage.removeItem("hazi_token");
    setToken(null);
    setAuthTokenGetter(() => null);
    queryClient.clear();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading: !!token && isUserLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
