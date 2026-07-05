import { createContext, useContext, useState, ReactNode } from "react";
import { isAdminOrManager as checkIsAdminOrManager } from "@/lib/departments";

export interface AuthUser {
  id: number | string;
  username: string;
  full_name: string;
  email?: string;
  department?: string;
  role?: string;
  status?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAdminOrManager: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const login = (nextUser: AuthUser) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdminOrManager: checkIsAdminOrManager(user), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
