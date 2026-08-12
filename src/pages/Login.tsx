import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

interface User {
  id?: number;
  name?: string;
  email?: string;
  role: string;
}

interface LoginResponse {
  message: string;
  token: string;
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // -----------------------------------------------------
      // LOGIN API
      // -----------------------------------------------------

      const response = await fetch(
        "http://localhost:5110/api/Auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      // -----------------------------------------------------
      // READ RESPONSE
      // -----------------------------------------------------

      const contentType =
        response.headers.get("content-type") || "";

      let data:
        | LoginResponse
        | { message?: string };

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text =
          await response.text();

        console.error(
          "Backend returned non-JSON response:",
          text
        );

        throw new Error(
          `Server returned HTTP ${response.status}. Please check the backend.`
        );
      }

      // -----------------------------------------------------
      // CHECK HTTP STATUS
      // -----------------------------------------------------

      if (!response.ok) {
        throw new Error(
          "message" in data &&
          data.message
            ? data.message
            : "Invalid email or password."
        );
      }

      // -----------------------------------------------------
      // CHECK TOKEN
      // -----------------------------------------------------

      if (
        !("token" in data) ||
        !data.token
      ) {
        throw new Error(
          "Login succeeded but authentication token was not received."
        );
      }

      const token = data.token;

      // -----------------------------------------------------
      // VALIDATE JWT
      // -----------------------------------------------------

      const tokenParts =
        token.split(".");

      if (tokenParts.length !== 3) {
        throw new Error(
          "Invalid authentication token."
        );
      }

      // -----------------------------------------------------
      // DECODE JWT PAYLOAD
      // -----------------------------------------------------

      let payload: Record<
        string,
        any
      >;

      try {
        payload = JSON.parse(
          atob(
            tokenParts[1]
              .replace(/-/g, "+")
              .replace(/_/g, "/")
          )
        );
      } catch (decodeError) {
        console.error(
          "JWT decode error:",
          decodeError
        );

        throw new Error(
          "Unable to read authentication token."
        );
      }

      console.log(
        "JWT payload:",
        payload
      );

      // -----------------------------------------------------
      // GET USER ID
      // -----------------------------------------------------

      const userId =
        payload.sub ||
        payload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];

      // -----------------------------------------------------
      // GET USER NAME
      // -----------------------------------------------------

      const userName =
        payload.name ||
        payload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        ] ||
        "";

      // -----------------------------------------------------
      // GET USER EMAIL
      // -----------------------------------------------------

      const userEmail =
        payload.email ||
        payload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        ] ||
        email.trim();

      // -----------------------------------------------------
      // GET USER ROLE
      // -----------------------------------------------------

      const role =
        payload.role ||
        payload[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ];

      console.log(
        "Detected role:",
        role
      );

      // -----------------------------------------------------
      // ROLE VALIDATION
      // -----------------------------------------------------

      if (!role) {
        throw new Error(
          "User role was not found in the authentication token."
        );
      }

      const normalizedRole =
        String(role)
          .trim()
          .toLowerCase();

      // -----------------------------------------------------
      // CHECK VALID ROLES
      // -----------------------------------------------------

      if (
        normalizedRole !== "admin" &&
        normalizedRole !== "staff" &&
        normalizedRole !== "customer"
      ) {
        throw new Error(
          `Unknown user role: ${role}`
        );
      }

      // -----------------------------------------------------
      // CREATE USER OBJECT
      // -----------------------------------------------------

      const user: User = {
        id: userId
          ? Number(userId)
          : undefined,

        name: userName,

        email: userEmail,

        role:
          normalizedRole
            .charAt(0)
            .toUpperCase() +
          normalizedRole.slice(1),
      };

      console.log(
        "Authenticated user:",
        user
      );

      // -----------------------------------------------------
      // SAVE AUTHENTICATION DATA
      // -----------------------------------------------------

      sessionStorage.setItem(
        "token",
        token
      );

      sessionStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      sessionStorage.setItem(
        "role",
        user.role
      );

      // -----------------------------------------------------
      // REDIRECT BY ROLE
      // -----------------------------------------------------

      if (
        normalizedRole === "admin"
      ) {
        navigate("/admin", {
          replace: true,
        });

        return;
      }

      if (
        normalizedRole === "staff"
      ) {
        navigate("/staff", {
          replace: true,
        });

        return;
      }

      if (
        normalizedRole === "customer"
      ) {
        navigate("/customer", {
          replace: true,
        });

        return;
      }

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      // Remove partially saved authentication data
      sessionStorage.removeItem(
        "token"
      );

      sessionStorage.removeItem(
        "user"
      );

      sessionStorage.removeItem(
        "role"
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to login. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f6f9",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >

      {/* ===================================================
          LOGIN CARD
      =================================================== */}

      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          backgroundColor: "#ffffff",
          padding: "40px",
          borderRadius: "16px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.10)",
          boxSizing: "border-box",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >

          <Link
            to="/"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontSize: "32px",
              fontWeight: "700",
            }}
          >
            QueueFlow
          </Link>

          <h2
            style={{
              marginTop: "14px",
              marginBottom: "8px",
              color: "#1e293b",
            }}
          >
            Login
          </h2>

          <p
            style={{
              color: "#64748b",
              margin: 0,
            }}
          >
            Login to your QueueFlow account
          </p>

        </div>


        {/* =================================================
            LOGIN FORM
        ================================================= */}

        <form
          onSubmit={handleLogin}
        >

          {/* EMAIL */}

          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            disabled={loading}
            autoComplete="email"
            style={{
              width: "100%",
              padding: "13px",
              marginBottom: "20px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />


          {/* PASSWORD */}

          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            disabled={loading}
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "13px",
              marginBottom: "20px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />


          {/* ERROR */}

          {error && (
            <div
              style={{
                backgroundColor:
                  "#fee2e2",
                color: "#b91c1c",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              ⚠️ {error}
            </div>
          )}


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "8px",
              backgroundColor:
                loading
                  ? "#94a3b8"
                  : "#2563eb",
              color: "#ffffff",
              fontSize: "17px",
              fontWeight: "600",
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>


        {/* =================================================
            BACK TO HOME
        ================================================= */}

        <div
          style={{
            textAlign: "center",
            marginTop: "25px",
          }}
        >

          <Link
            to="/"
            style={{
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            ← Back to Home
          </Link>

        </div>

      </div>

    </div>
  );
}