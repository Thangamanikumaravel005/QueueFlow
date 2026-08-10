import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: string;
}

function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const storedUser = sessionStorage.getItem("user");

  // User is not logged in
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);

    // User's role doesn't match the page
    if (
      user.role?.toLowerCase() !==
      allowedRole.toLowerCase()
    ) {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  } catch {
    // Invalid session data
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("role");

    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;