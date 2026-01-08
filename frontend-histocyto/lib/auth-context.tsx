"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/api";
import { AUTH_CONFIG, ROUTES } from "@/lib/config";

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  role: "admin" | "doctor";
  qualification: string | null;
  registration_number: string | null;
  department: string | null;
  is_active: boolean;
  is_superuser: boolean;
  signature_image_url: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        const storedUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verify token is still valid
          try {
            const userData = await authService.getMe(storedToken);
            setUser(userData);
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
          } catch {
            // Token expired, clear auth
            clearAuth();
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Redirect logic
  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ["/login", "/register", "/forgot-password"];
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname?.startsWith(`${route}/`)
    );

    if (!user && !isPublicRoute && pathname?.startsWith("/dashboard")) {
      router.push(ROUTES.LOGIN);
    }

    if (user && isPublicRoute) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isLoading, user, pathname, router]);

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    document.cookie = `${AUTH_CONFIG.COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  };

  const login = async (username: string, password: string) => {
    try {
      const data = await authService.login(username, password);
      const userData = await authService.getMe(data.access_token);

      setToken(data.access_token);
      setUser(userData);

      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.access_token);
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
      document.cookie = `${AUTH_CONFIG.COOKIE_NAME}=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;

      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    if (token) {
      authService.logout(token).catch(console.error);
    }
    clearAuth();
    router.push(ROUTES.LOGIN);
  };

  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAdmin,
        isDoctor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
