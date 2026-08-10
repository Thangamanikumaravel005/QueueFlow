import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type UserRole = "customer" | "staff" | "admin";

interface User {
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (name: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const login = (name: string, role: UserRole) => {
    setUser({
      name,
      role,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}