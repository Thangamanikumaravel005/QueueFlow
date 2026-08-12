import { Link } from "react-router-dom";
import { useState } from "react";
import { useQueue } from "../context/QueueContext";

export default function Home() {
  const { services } = useQueue();

  const [selectedService, setSelectedService] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const handleGetToken = async () => {
    if (!selectedService) {
      setMessage("Please select a service.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setToken(null);

      const response = await fetch(
        "http://localhost:5110/api/Queue",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service: selectedService,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to generate queue token."
        );
      }

      setToken(data.queue.tokenNumber);
      setMessage(
        `Token #${data.queue.tokenNumber} generated successfully.`
      );
    } catch (error) {
      console.error("Token generation error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate queue token."
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
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            fontSize: "24px",
            fontWeight: "700",
            color: "#2563eb",
          }}
        >
          QueueFlow
        </Link>

        <Link
          to="/login"
          style={{
            textDecoration: "none",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "10px 22px",
            borderRadius: "8px",
            fontWeight: "600",
          }}
        >
          Login
        </Link>
      </nav>

      {/* Main */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "55px 25px",
        }}
      >
        {/* Heading */}
        <section
          style={{
            textAlign: "center",
            marginBottom: "45px",
          }}
        >
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "52px",
              color: "#2563eb",
            }}
          >
            Welcome to QueueFlow
          </h1>

          <p
            style={{
              fontSize: "23px",
              color: "#475569",
              marginBottom: "12px",
            }}
          >
            Digital Queue Management System
          </p>

          <p
            style={{
              fontSize: "18px",
              color: "#64748b",
            }}
          >
            Get your token and track your queue position easily.
          </p>
        </section>

        {/* Token Card */}
        <section
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "42px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.10)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "35px",
              fontSize: "30px",
              color: "#1e293b",
            }}
          >
            Get Your Queue Token
          </h2>

          <label
            htmlFor="service"
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "18px",
              color: "#334155",
            }}
          >
            Select a Service
          </label>

          <select
            id="service"
            value={selectedService}
            onChange={(event) =>
              setSelectedService(event.target.value)
            }
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "10px",
              border: "2px solid #2563eb",
              fontSize: "17px",
              boxSizing: "border-box",
            }}
          >
            <option value="">
              Choose a service
            </option>

            {Array.isArray(services) &&
              services.map(
                (service: any, index: number) => {
                  const value =
                    typeof service === "string"
                      ? service
                      : service.name ??
                        service.service ??
                        service.title ??
                        `Service ${index + 1}`;

                  return (
                    <option
                      key={index}
                      value={value}
                    >
                      {value}
                    </option>
                  );
                }
              )}
          </select>

          <button
            type="button"
            onClick={handleGetToken}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "28px",
              padding: "16px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: loading
                ? "#94a3b8"
                : "#2563eb",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: "600",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Generating Token..."
              : "Get Queue Token"}
          </button>

          {/* Message */}
          {message && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                borderRadius: "8px",
                backgroundColor: token
                  ? "#dcfce7"
                  : "#eff6ff",
                color: token
                  ? "#15803d"
                  : "#1d4ed8",
                textAlign: "center",
              }}
            >
              {message}
            </div>
          )}

          {/* Token display */}
          {token !== null && (
            <div
              style={{
                marginTop: "25px",
                padding: "25px",
                borderRadius: "12px",
                backgroundColor: "#f0fdf4",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  color: "#166534",
                  fontSize: "18px",
                }}
              >
                Your Queue Token
              </p>

              <h2
                style={{
                  margin: 0,
                  fontSize: "48px",
                  color: "#16a34a",
                }}
              >
                A-{token}
              </h2>

              <p
                style={{
                  marginTop: "10px",
                  color: "#475569",
                }}
              >
                Please wait for your turn.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}