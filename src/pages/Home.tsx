import { Link } from "react-router-dom";
import { useState } from "react";
import { useQueue } from "../context/QueueContext";

export default function Home() {
  const { services, getToken } = useQueue() as any;

  const [selectedService, setSelectedService] = useState("");
  const [message, setMessage] = useState("");

  const handleGetToken = async () => {
    if (!selectedService) {
      setMessage("Please select a service.");
      return;
    }

    try {
      setMessage("");

      await getToken(selectedService);

      setMessage("Queue token generated successfully.");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to get queue token."
      );
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
          width: "100%",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 40px",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Logo */}
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

        {/* Navigation buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: "none",
              color: "#374151",
              padding: "9px 16px",
              borderRadius: "7px",
              fontWeight: "500",
            }}
          >
            Home
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
        </div>
      </nav>

      {/* Main content */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "55px 25px",
        }}
      >
        {/* Hero */}
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
              fontWeight: "700",
              color: "#2563eb",
            }}
          >
            Welcome to QueueFlow
          </h1>

          <p
            style={{
              margin: "0 0 12px",
              fontSize: "23px",
              color: "#475569",
            }}
          >
            Digital Queue Management System
          </p>

          <p
            style={{
              margin: 0,
              fontSize: "18px",
              color: "#64748b",
            }}
          >
            Get your token and track your queue position easily.
          </p>
        </section>

        {/* Token card */}
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
              color: "#1e293b",
              fontSize: "30px",
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
              fontWeight: "500",
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
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "10px",
              border: "2px solid #2563eb",
              fontSize: "17px",
              backgroundColor: "#ffffff",
              boxSizing: "border-box",
              outline: "none",
            }}
          >
            <option value="">Choose a service</option>

            {Array.isArray(services) &&
              services.map((service: any, index: number) => {
                const value =
                  typeof service === "string"
                    ? service
                    : service.name ??
                      service.service ??
                      service.title ??
                      `Service ${index + 1}`;

                const label =
                  typeof service === "string"
                    ? service
                    : service.name ??
                      service.service ??
                      service.title ??
                      `Service ${index + 1}`;

                return (
                  <option key={index} value={value}>
                    {label}
                  </option>
                );
              })}
          </select>

          <button
            type="button"
            onClick={handleGetToken}
            style={{
              width: "100%",
              marginTop: "28px",
              padding: "16px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Get Queue Token
          </button>

          {message && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                borderRadius: "8px",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                textAlign: "center",
              }}
            >
              {message}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}