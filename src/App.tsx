import { Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import CustomerDashboard from "./pages/CustomerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import { QueueProvider } from "./context/QueueContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "Admin" | "Staff" | "Customer";
}

function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const token = sessionStorage.getItem("token");
  const userString = sessionStorage.getItem("user");

  // Not logged in
  if (!token || !userString) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  try {
    const user = JSON.parse(userString);

    const userRole =
      String(user.role || "").toLowerCase();

    const requiredRole =
      allowedRole.toLowerCase();

    // Wrong role
    if (userRole !== requiredRole) {
      if (userRole === "admin") {
        return (
          <Navigate
            to="/admin"
            replace
          />
        );
      }

      if (userRole === "staff") {
        return (
          <Navigate
            to="/staff"
            replace
          />
        );
      }

      if (userRole === "customer") {
        return (
          <Navigate
            to="/customer"
            replace
          />
        );
      }

      sessionStorage.clear();

      return (
        <Navigate
          to="/login"
          replace
        />
      );
    }

    return <>{children}</>;
  } catch (error) {
    console.error(
      "Invalid stored user:",
      error
    );

    sessionStorage.clear();

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }
}

export default function App() {
  return (
    <QueueProvider>
      <Routes>

        {/* ==============================
            PUBLIC ROUTES
        ============================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />


        {/* ==============================
            CUSTOMER
        ============================== */}

        <Route
          path="/customer"
          element={
            <ProtectedRoute
              allowedRole="Customer"
            >
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />


        {/* ==============================
            STAFF
        ============================== */}

        <Route
          path="/staff"
          element={
            <ProtectedRoute
              allowedRole="Staff"
            >
              <StaffDashboard />
            </ProtectedRoute>
          }
        />


        {/* ==============================
            ADMIN
        ============================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRole="Admin"
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />


        {/* ==============================
            UNKNOWN ROUTE
        ============================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </QueueProvider>
  );
}