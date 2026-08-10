import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

const API_URL = "http://localhost:5110/api/Auth";

function Login() {
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

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const responseText = await response.text();

      let data: LoginResponse | { message?: string };

      try {
        data = JSON.parse(responseText);
      } catch {
        data = {
          message: responseText,
        };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Invalid email or password."
        );
      }

      const loginData = data as LoginResponse;

      sessionStorage.setItem(
  "token",
  loginData.token
);

sessionStorage.setItem(
  "user",
  JSON.stringify(loginData.user)
);

sessionStorage.setItem(
  "role",
  loginData.user.role
);

      // Redirect according to role
      switch (
        loginData.user.role.toLowerCase()
      ) {
        case "customer":
          navigate("/customer");
          break;

        case "staff":
          navigate("/staff");
          break;

        case "admin":
          navigate("/admin");
          break;

        default:
          setError(
            "Your account does not have a valid role."
          );
      }
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* Header */}

          <div className="text-center mb-8">

            <h1 className="text-3xl font-bold text-blue-600">
              QueueFlow
            </h1>

            <h2 className="text-2xl font-bold text-gray-800 mt-4">
              Login
            </h2>

            <p className="text-gray-500 mt-2">
              Sign in to your QueueFlow account.
            </p>

          </div>


          {/* Error */}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}


          {/* Login Form */}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Email */}

            <div>

              <label
                htmlFor="email"
                className="block mb-2 font-semibold text-gray-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

            </div>


            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="block mb-2 font-semibold text-gray-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

            </div>


            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading
                ? "Signing in..."
                : "Login"}
            </button>

          </form>


          {/* Back Home */}

          <div className="text-center mt-6">

            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Home
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;