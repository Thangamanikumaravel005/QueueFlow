import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

interface QueueItem {
  id: number;
  tokenNumber: number;
  service: string;
  status: string;
  createdAt?: string;
  customerId?: number;
  peopleAhead?: number;
}

interface TokenResponse {
  id?: number;
  tokenNumber?: number;
  service?: string;
  status?: string;
  createdAt?: string;
  customerId?: number;
  peopleAhead?: number;
  message?: string;
}

interface User {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
}

interface Service {
  name: string;
  icon: string;
  description: string;
}

const API_URL = "http://localhost:5110/api";

const SERVICES: Service[] = [
  {
    name: "Cash Deposit",
    icon: "↓",
    description: "Deposit cash into your account",
  },
  {
    name: "Cash Withdrawal",
    icon: "↑",
    description: "Withdraw cash from your account",
  },
  {
    name: "Account Enquiry",
    icon: "i",
    description: "Check your account information",
  },
  {
    name: "Loan Enquiry",
    icon: "₹",
    description: "Get assistance with loan services",
  },
];

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [currentToken, setCurrentToken] =
    useState<QueueItem | null>(null);

  const [loading, setLoading] = useState(false);
  const [queueLoading, setQueueLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // ONLY WAITING AND SERVING ARE ACTIVE
  // COMPLETED / CANCELLED ALLOW NEW TOKEN
  // =========================================================

  const hasActiveToken =
    currentToken !== null &&
    ["waiting", "serving"].includes(
      currentToken.status.toLowerCase()
    );

  // =========================================================
  // LOAD USER
  // =========================================================

  useEffect(() => {
    try {
      const storedUser =
        sessionStorage.getItem("user");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error(
        "Unable to load user:",
        error
      );
    }
  }, []);

  // =========================================================
  // AUTH TOKEN
  // =========================================================

  const getAuthToken = (): string | null => {
    const token =
      sessionStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return null;
    }

    return token;
  };

  // =========================================================
  // LOAD CURRENT TOKEN
  // =========================================================

  const loadCurrentToken =
    useCallback(async () => {
      try {
        setQueueLoading(true);

        const token =
          sessionStorage.getItem("token");

        if (!token) {
          navigate("/login", {
            replace: true,
          });

          return;
        }

        const response = await fetch(
          `${API_URL}/Queue/my-token`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );

        if (response.status === 401) {
          sessionStorage.clear();

          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (response.status === 403) {
          setError(
            "You are not authorized to view your queue."
          );

          return;
        }

        if (response.status === 404) {
          setCurrentToken(null);
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Unable to load queue information."
          );
        }

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        if (
          !contentType.includes(
            "application/json"
          )
        ) {
          throw new Error(
            "Invalid response from server."
          );
        }

        const data:
          | TokenResponse
          | null =
          await response.json();

        if (!data) {
          setCurrentToken(null);
          return;
        }

        const queueItem: QueueItem = {
          id: Number(data.id ?? 0),
          tokenNumber: Number(
            data.tokenNumber ?? 0
          ),
          service: data.service ?? "",
          status:
            data.status ?? "Waiting",
          createdAt: data.createdAt,
          customerId: data.customerId,
          peopleAhead: data.peopleAhead,
        };

        setCurrentToken(queueItem);
      } catch (error) {
        console.error(
          "Load queue error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load queue."
        );
      } finally {
        setQueueLoading(false);
      }
    }, [navigate]);

  // =========================================================
  // INITIAL LOAD + AUTO REFRESH
  // =========================================================

  useEffect(() => {
    loadCurrentToken();

    const interval =
      window.setInterval(
        loadCurrentToken,
        5000
      );

    return () => {
      window.clearInterval(interval);
    };
  }, [loadCurrentToken]);

  // =========================================================
  // SELECT SERVICE
  // =========================================================

  const selectService = (
    serviceName: string
  ) => {
    setError("");
    setSuccess("");

    if (hasActiveToken) {
      setError(
        `You already have active token #${currentToken?.tokenNumber}. Please wait until it is completed.`
      );

      return;
    }

    setSelectedService(serviceName);
  };

  // =========================================================
  // GET NEW TOKEN
  // =========================================================

  const handleGetToken = async () => {
    setError("");
    setSuccess("");

    if (!selectedService) {
      setError(
        "Please select a service first."
      );

      return;
    }

    if (hasActiveToken) {
      setError(
        `You already have active token #${currentToken?.tokenNumber}.`
      );

      return;
    }

    try {
      setLoading(true);

      const token = getAuthToken();

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/Queue`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            service: selectedService,
          }),
        }
      );

      if (response.status === 401) {
        sessionStorage.clear();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (response.status === 403) {
        setError(
          "You are not authorized to create a queue token."
        );

        return;
      }

      if (response.status === 409) {
        setError(
          "You already have an active queue token."
        );

        await loadCurrentToken();

        return;
      }

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data:
        | TokenResponse
        | { message?: string } = {};

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        throw new Error(
          `Server returned HTTP ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(
          "message" in data &&
          data.message
            ? data.message
            : "Unable to generate token."
        );
      }

      const tokenNumber =
        "tokenNumber" in data
          ? data.tokenNumber
          : undefined;

      setSuccess(
        tokenNumber
          ? `Token #${tokenNumber} generated successfully.`
          : "Your new queue token has been generated successfully."
      );

      setSelectedService("");

      await loadCurrentToken();
    } catch (error) {
      console.error(
        "Get token error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate token."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    sessionStorage.clear();

    navigate("/login", {
      replace: true,
    });
  };

  // =========================================================
  // USER DETAILS
  // =========================================================

  const displayName =
    user?.name || "Customer";

  const firstName =
    displayName.split(" ")[0] ||
    "Customer";

  const initials =
    displayName
      .split(" ")
      .map((part) =>
        part.charAt(0)
      )
      .slice(0, 2)
      .join("")
      .toUpperCase();

  // =========================================================
  // STATUS
  // =========================================================

  const getStatusClass = (
    status: string
  ) =>
    `status-${status
      .toLowerCase()
      .replace(/\s+/g, "-")}`;

  return (
    <div className="customer-dashboard">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            Q
          </div>

          <div>
            <h2>QueueFlow</h2>
            <span>
              Smart Queue System
            </span>
          </div>

        </div>


        <nav className="sidebar-nav">

          <div className="nav-label">
            MAIN MENU
          </div>

          <button
            className="nav-item active"
            type="button"
          >
            <span className="nav-icon">
              ▦
            </span>

            Dashboard
          </button>


          <button
            className="nav-item"
            type="button"
            onClick={() =>
              document
                .getElementById(
                  "services"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <span className="nav-icon">
              +
            </span>

            New Token
          </button>


          <button
            className="nav-item"
            type="button"
            onClick={() =>
              document
                .getElementById(
                  "queue"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <span className="nav-icon">
              ◷
            </span>

            My Queue
          </button>


          <div className="nav-label second">
            ACCOUNT
          </div>


          <button
            className="nav-item"
            type="button"
          >
            <span className="nav-icon">
              ?
            </span>

            Help & Support
          </button>

        </nav>


        <div className="sidebar-bottom">

          <div className="sidebar-user">

            <div className="sidebar-avatar">
              {initials}
            </div>

            <div className="sidebar-user-info">
              <strong>
                {displayName}
              </strong>

              <span>
                Customer
              </span>
            </div>

          </div>


          <button
            type="button"
            className="sidebar-logout"
            onClick={logout}
          >
            <span>
              ↪
            </span>

            Logout
          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="main-area">

        {/* ===================================================
            TOP HEADER
        =================================================== */}

        <header className="top-header">

          <div>

            <span className="header-small">
              CUSTOMER PORTAL
            </span>

            <h1>
              Dashboard
            </h1>

          </div>


          <div className="header-right">

            <div className="notification-bell">
              ♢
              <span />
            </div>


            <div className="header-profile">

              <div className="header-avatar">
                {initials}
              </div>

              <div>
                <strong>
                  {displayName}
                </strong>

                <span>
                  Customer
                </span>
              </div>

            </div>

          </div>

        </header>


        <main className="content">


          {/* =================================================
              WELCOME
          ================================================= */}

          <section className="welcome-section">

            <div>

              <span className="welcome-tag">
                GOOD DAY
              </span>

              <h2>
                Hello, {firstName}!
              </h2>

              <p>
                Manage your banking queue
                quickly and easily.
              </p>

            </div>


            <div className="welcome-decoration">

              <div className="decoration-ring">
                <span>
                  Q
                </span>
              </div>

            </div>

          </section>


          {/* =================================================
              ALERTS
          ================================================= */}

          {error && (

            <div className="alert error-alert">

              <div className="alert-symbol">
                !
              </div>

              <div className="alert-content">

                <strong>
                  Something went wrong
                </strong>

                <p>
                  {error}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
              >
                ×
              </button>

            </div>

          )}


          {success && (

            <div className="alert success-alert">

              <div className="alert-symbol">
                ✓
              </div>

              <div className="alert-content">

                <strong>
                  Token Generated
                </strong>

                <p>
                  {success}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSuccess("")
                }
              >
                ×
              </button>

            </div>

          )}


          {/* =================================================
              CURRENT TOKEN
          ================================================= */}

          <section className="token-overview">

            <div className="section-header">

              <div>

                <span>
                  CURRENT TOKEN
                </span>

                <h2>
                  Your Queue
                </h2>

              </div>


              <button
                type="button"
                className="refresh-button"
                onClick={
                  loadCurrentToken
                }
                disabled={
                  queueLoading
                }
              >
                <span
                  className={
                    queueLoading
                      ? "refresh-spin"
                      : ""
                  }
                >
                  ↻
                </span>

                Refresh
              </button>

            </div>


            {queueLoading ? (

              <div className="token-loading">

                <div className="loader" />

                <span>
                  Loading queue...
                </span>

              </div>

            ) : currentToken ? (

              <div className="token-card">

                <div className="token-main">

                  <span className="token-caption">
                    TOKEN NUMBER
                  </span>

                  <strong>
                    #{currentToken.tokenNumber}
                  </strong>

                  <p>
                    {currentToken.service}
                  </p>

                </div>


                <div className="token-stat">

                  <span>
                    STATUS
                  </span>

                  <div
                    className={
                      `status-badge ${getStatusClass(
                        currentToken.status
                      )}`
                    }
                  >

                    <i />

                    {currentToken.status}

                  </div>

                </div>


                <div className="token-stat">

                  <span>
                    PEOPLE AHEAD
                  </span>

                  <strong>
                    {currentToken.peopleAhead ??
                      0}
                  </strong>

                  <small>
                    {hasActiveToken
                      ? "in queue"
                      : "completed"}
                  </small>

                </div>


                <div className="token-stat">

                  <span>
                    SERVICE
                  </span>

                  <strong className="service-value">
                    {currentToken.service}
                  </strong>

                </div>

              </div>

            ) : (

              <div className="no-token">

                <div className="no-token-icon">
                  +
                </div>

                <div>

                  <h3>
                    No active token
                  </h3>

                  <p>
                    Select a service below
                    to generate your token.
                  </p>

                </div>

              </div>

            )}

          </section>


          {/* =================================================
              SERVICES
          ================================================= */}

          <section
            className="services-section"
            id="services"
          >

            <div className="section-header">

              <div>

                <span>
                  BANKING SERVICES
                </span>

                <h2>
                  Select a Service
                </h2>

                <p>
                  Choose the service you
                  need today.
                </p>

              </div>

            </div>


            <div className="services-grid">

              {SERVICES.map(
                (service) => {

                  const selected =
                    selectedService ===
                    service.name;

                  return (

                    <button
                      key={service.name}
                      type="button"

                      className={
                        selected
                          ? "service-card selected"
                          : "service-card"
                      }

                      disabled={
                        loading ||
                        hasActiveToken
                      }

                      onClick={() =>
                        selectService(
                          service.name
                        )
                      }
                    >

                      <div className="service-top">

                        <div
                          className={
                            selected
                              ? "service-icon selected-icon"
                              : "service-icon"
                          }
                        >
                          {service.icon}
                        </div>


                        <div
                          className={
                            selected
                              ? "radio selected"
                              : "radio"
                          }
                        >
                          {selected
                            ? "✓"
                            : ""}
                        </div>

                      </div>


                      <div className="service-text">

                        <h3>
                          {service.name}
                        </h3>

                        <p>
                          {service.description}
                        </p>

                      </div>


                      <div className="service-action">

                        <span>
                          {selected
                            ? "Selected"
                            : "Select service"}
                        </span>

                        <b>
                          →
                        </b>

                      </div>

                    </button>

                  );
                }
              )}

            </div>


            {/* =================================================
                GENERATE TOKEN
            ================================================= */}

            <div className="token-action">

              <div className="selected-display">

                <div className="selected-icon">
                  {selectedService
                    ? "✓"
                    : "+"}
                </div>

                <div>

                  <span>
                    SELECTED SERVICE
                  </span>

                  <strong>
                    {selectedService ||
                      "Please select a service"}
                  </strong>

                </div>

              </div>


              <button
                type="button"
                className="generate-token-button"

                disabled={
                  loading ||
                  !selectedService ||
                  hasActiveToken
                }

                onClick={
                  handleGetToken
                }
              >

                {loading ? (

                  <>
                    <span className="button-loader" />
                    Generating...
                  </>

                ) : hasActiveToken ? (

                  <>
                    Token #
                    {currentToken?.tokenNumber}
                    {" "}Active
                  </>

                ) : (

                  <>
                    Get New Token
                    <span>
                      →
                    </span>
                  </>

                )}

              </button>

            </div>

          </section>


          {/* =================================================
              QUEUE INFORMATION
          ================================================= */}

          <section
            className="queue-section"
            id="queue"
          >

            <div className="section-header">

              <div>

                <span>
                  LIVE QUEUE
                </span>

                <h2>
                  Queue Information
                </h2>

                <p>
                  Your queue status updates
                  automatically.
                </p>

              </div>

            </div>


            {currentToken ? (

              <div className="queue-panel">

                <div className="queue-progress">

                  <div className="progress-top">

                    <span>
                      QUEUE PROGRESS
                    </span>

                    <strong>
                      {currentToken.status}
                    </strong>

                  </div>


                  <div className="progress-track">

                    <div
                      className={
                        currentToken.status
                          .toLowerCase() ===
                        "completed"
                          ? "progress-fill completed"
                          : "progress-fill"
                      }
                    />

                  </div>


                  <div className="progress-labels">

                    <span>
                      Token Created
                    </span>

                    <span>
                      Your Turn
                    </span>

                    <span>
                      Completed
                    </span>

                  </div>

                </div>


                <div className="queue-summary">

                  <div>

                    <span>
                      TOKEN
                    </span>

                    <strong>
                      #{currentToken.tokenNumber}
                    </strong>

                  </div>


                  <div>

                    <span>
                      AHEAD
                    </span>

                    <strong>
                      {currentToken.peopleAhead ??
                        0}
                    </strong>

                  </div>


                  <div>

                    <span>
                      SERVICE
                    </span>

                    <strong>
                      {currentToken.service}
                    </strong>

                  </div>

                </div>

              </div>

            ) : (

              <div className="empty-queue">

                <div className="empty-illustration">
                  Q
                </div>

                <h3>
                  Your queue is empty
                </h3>

                <p>
                  Select a banking service
                  to join the queue.
                </p>

              </div>

            )}

          </section>


          {/* =================================================
              HOW IT WORKS
          ================================================= */}

          <section className="steps-section">

            <div className="section-header">

              <div>

                <span>
                  SIMPLE PROCESS
                </span>

                <h2>
                  How QueueFlow Works
                </h2>

              </div>

            </div>


            <div className="steps-grid">

              <div className="step">

                <div className="step-number">
                  01
                </div>

                <div className="step-icon">
                  +
                </div>

                <h3>
                  Select Service
                </h3>

                <p>
                  Choose the banking
                  service you require.
                </p>

              </div>


              <div className="step">

                <div className="step-number">
                  02
                </div>

                <div className="step-icon">
                  #
                </div>

                <h3>
                  Get Your Token
                </h3>

                <p>
                  Generate a unique
                  queue token.
                </p>

              </div>


              <div className="step">

                <div className="step-number">
                  03
                </div>

                <div className="step-icon">
                  ◷
                </div>

                <h3>
                  Wait Comfortably
                </h3>

                <p>
                  Monitor your queue
                  position in real time.
                </p>

              </div>


              <div className="step">

                <div className="step-number">
                  04
                </div>

                <div className="step-icon">
                  ✓
                </div>

                <h3>
                  Get Served
                </h3>

                <p>
                  Visit the counter when
                  your token is called.
                </p>

              </div>

            </div>

          </section>


          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="footer">

            <div className="footer-brand">

              <div className="footer-logo">
                Q
              </div>

              <div>

                <strong>
                  QueueFlow
                </strong>

                <span>
                  Smart Queue Management
                </span>

              </div>

            </div>

            <span>
              © 2026 QueueFlow
            </span>

          </footer>

        </main>

      </div>


      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .customer-dashboard {
          min-height: 100vh;
          display: flex;
          background: #f5f7fb;
          color: #172033;
          font-family:
            "times  New Roman",
            "Segoe UI",
            Arial,
            sans-serif;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            box-shadow:
              0 0 0 0
              rgba(37,99,235,.2);
          }

          50% {
            box-shadow:
              0 0 0 10px
              rgba(37,99,235,0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-6px);
          }
        }


        /* =====================================================
           SIDEBAR
        ===================================================== */

        .sidebar {
          width: 245px;
          min-height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          padding: 25px 16px;
          background: #111827;
          color: white;
          z-index: 100;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 8px;
          margin-bottom: 40px;
        }

        .sidebar-logo {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );
          font-size: 20px;
          font-weight: 800;
        }

        .sidebar-brand h2 {
          margin: 0;
          font-size: 17px;
        }

        .sidebar-brand span {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 8px;
        }

        .nav-label {
          margin: 0 10px 9px;
          color: #64748b;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .nav-label.second {
          margin-top: 30px;
        }

        .nav-item {
          width: 100%;
          height: 43px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
          padding: 0 12px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #94a3b8;
          font-family: times, "Segoe UI", Arial, sans-serif;
          font-size: 11px;
          text-align: left;
          cursor: pointer;
          transition: .2s ease;
        }

        .nav-item:hover {
          background: #1f2937;
          color: white;
          transform: translateX(2px);
        }

        .nav-item.active {
          background: #2563eb;
          color: white;
          box-shadow:
            0 5px 15px
            rgba(37,99,235,.18);
        }

        .nav-icon {
          width: 20px;
          text-align: center;
          font-size: 15px;
        }

        .sidebar-bottom {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid #263244;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 5px;
          margin-bottom: 15px;
        }

        .sidebar-avatar {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dbeafe;
          color: #2563eb;
          font-size: 10px;
          font-weight: 800;
        }

        .sidebar-user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-user-info strong {
          font-size: 10px;
        }

        .sidebar-user-info span {
          color: #64748b;
          font-size: 8px;
        }

        .sidebar-logout {
          width: 100%;
          padding: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #374151;
          border-radius: 8px;
          background: transparent;
          color: #94a3b8;
          font-family: times, "Segoe UI", Arial, sans-serif;
          font-size: 10px;
          cursor: pointer;
          transition: .2s ease;
        }

        .sidebar-logout:hover {
          border-color: #ef4444;
          color: #f87171;
          background: rgba(239,68,68,.05);
        }


        /* =====================================================
           MAIN AREA
        ===================================================== */

        .main-area {
          width: calc(100% - 245px);
          margin-left: 245px;
          min-height: 100vh;
        }


        /* =====================================================
           HEADER
        ===================================================== */

        .top-header {
          height: 74px;
          padding: 0 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,.96);
          border-bottom: 1px solid #e7ebf1;
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(10px);
        }

        .header-small {
          color: #2563eb;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.3px;
        }

        .top-header h1 {
          margin: 3px 0 0;
          font-size: 20px;
          letter-spacing: -.3px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .notification-bell {
          width: 32px;
          height: 32px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #64748b;
          font-size: 17px;
        }

        .notification-bell span {
          width: 5px;
          height: 5px;
          position: absolute;
          top: 6px;
          right: 7px;
          border-radius: 50%;
          background: #ef4444;
        }

        .header-profile {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-avatar {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e8f0ff;
          color: #2563eb;
          font-size: 10px;
          font-weight: 800;
        }

        .header-profile div:last-child {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .header-profile strong {
          font-size: 10px;
        }

        .header-profile span {
          color: #94a3b8;
          font-size: 8px;
        }


        /* =====================================================
           CONTENT
        ===================================================== */

        .content {
          width: min(1150px, 92%);
          margin: auto;
          padding: 28px 0 45px;
        }


        /* =====================================================
           WELCOME
        ===================================================== */

        .welcome-section {
          min-height: 190px;
          padding: 30px 35px;
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          position: relative;
          border-radius: 18px;
          color: white;
          background:
            linear-gradient(
              120deg,
              #172554,
              #1d4ed8,
              #2563eb
            );
          box-shadow:
            0 14px 30px
            rgba(30,64,175,.13);
          animation:
            fadeUp .5s ease;
        }

        .welcome-section::after {
          content: "";
          width: 260px;
          height: 260px;
          position: absolute;
          right: 80px;
          top: -150px;
          border-radius: 50%;
          background: rgba(255,255,255,.05);
        }

        .welcome-tag {
          color: rgba(255,255,255,.6);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .welcome-section h2 {
          margin: 7px 0 8px;
          font-size: 31px;
          letter-spacing: -.7px;
        }

        .welcome-section p {
          margin: 0;
          color: rgba(255,255,255,.7);
          font-size: 12px;
        }

        .welcome-decoration {
          position: relative;
          z-index: 2;
        }

        .decoration-ring {
          width: 105px;
          height: 105px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 50%;
          background: rgba(255,255,255,.08);
          animation: float 3s ease-in-out infinite;
        }

        .decoration-ring span {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: rgba(255,255,255,.12);
          font-size: 27px;
          font-weight: 800;
        }


        /* =====================================================
           ALERTS
        ===================================================== */

        .alert {
          margin-bottom: 18px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 9px;
          animation: fadeUp .3s ease;
        }

        .error-alert {
          background: #fff5f5;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .success-alert {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .alert-symbol {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255,255,255,.8);
          font-weight: 800;
        }

        .alert-content {
          flex: 1;
        }

        .alert-content strong {
          display: block;
          font-size: 10px;
        }

        .alert-content p {
          margin: 2px 0 0;
          font-size: 10px;
        }

        .alert > button {
          border: none;
          background: transparent;
          color: inherit;
          font-size: 19px;
          cursor: pointer;
        }


        /* =====================================================
           SECTIONS
        ===================================================== */

        .token-overview,
        .services-section,
        .queue-section,
        .steps-section {
          margin-bottom: 35px;
        }

        .section-header {
          margin-bottom: 16px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }

        .section-header span {
          color: #2563eb;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.3px;
        }

        .section-header h2 {
          margin: 5px 0 3px;
          font-size: 22px;
          letter-spacing: -.3px;
        }

        .section-header p {
          margin: 0;
          color: #94a3b8;
          font-size: 10px;
        }


        /* =====================================================
           REFRESH
        ===================================================== */

        .refresh-button {
          padding: 7px 11px;
          display: flex;
          align-items: center;
          gap: 5px;
          border: 1px solid #dce3eb;
          border-radius: 7px;
          background: white;
          color: #64748b;
          font-family: times, "Segoe UI", Arial, sans-serif;
          font-size: 9px;
          cursor: pointer;
        }

        .refresh-button:hover {
          color: #2563eb;
          border-color: #93c5fd;
        }

        .refresh-button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .refresh-spin {
          display: inline-block;
          animation: spin .7s linear infinite;
        }


        /* =====================================================
           TOKEN CARD
        ===================================================== */

        .token-card {
          min-height: 145px;
          padding: 24px 27px;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
          align-items: center;
          gap: 20px;
          border-radius: 15px;
          color: white;
          background:
            linear-gradient(
              115deg,
              #111c44,
              #1d4ed8
            );
          box-shadow:
            0 10px 25px
            rgba(30,64,175,.1);
          animation:
            fadeUp .4s ease;
        }

        .token-caption,
        .token-stat > span {
          display: block;
          color: rgba(255,255,255,.55);
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .token-main > strong {
          display: block;
          margin: 3px 0;
          font-size: 39px;
          letter-spacing: -.5px;
        }

        .token-main p {
          margin: 0;
          color: rgba(255,255,255,.7);
          font-size: 11px;
        }

        .token-stat {
          min-height: 55px;
          padding-left: 20px;
          border-left: 1px solid rgba(255,255,255,.12);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
        }

        .token-stat > strong {
          font-size: 25px;
        }

        .token-stat small {
          color: rgba(255,255,255,.55);
          font-size: 8px;
        }

        .service-value {
          font-size: 11px !important;
        }

        .status-badge {
          width: fit-content;
          padding: 5px 9px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 20px;
          background: rgba(255,255,255,.12);
          font-size: 9px;
          font-weight: 700;
        }

        .status-badge i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fbbf24;
        }

        .status-serving i {
          background: #60a5fa;
        }

        .status-completed i {
          background: #4ade80;
        }

        .status-cancelled i {
          background: #f87171;
        }


        /* =====================================================
           LOADING
        ===================================================== */

        .token-loading {
          min-height: 145px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-radius: 15px;
          background: white;
          border: 1px solid #e5eaf0;
          color: #94a3b8;
          font-size: 10px;
        }

        .loader {
          width: 23px;
          height: 23px;
          border: 2px solid #e5eaf0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }


        /* =====================================================
           NO TOKEN
        ===================================================== */

        .no-token {
          min-height: 145px;
          padding: 25px;
          display: flex;
          align-items: center;
          gap: 15px;
          border: 1px solid #e5eaf0;
          border-radius: 15px;
          background: white;
        }

        .no-token-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 25px;
        }

        .no-token h3 {
          margin: 0 0 4px;
          font-size: 14px;
        }

        .no-token p {
          margin: 0;
          color: #94a3b8;
          font-size: 10px;
        }


        /* =====================================================
           SERVICES
        ===================================================== */

        .services-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
        }

        .service-card {
          min-height: 195px;
          padding: 18px;
          border: 1px solid #e3e8f0;
          border-radius: 13px;
          background: white;
          color: #172033;
          font-family: times, "Segoe UI", Arial, sans-serif;
          text-align: left;
          cursor: pointer;
          transition:
            transform .22s ease,
            border-color .22s ease,
            box-shadow .22s ease;
          animation:
            fadeUp .45s ease;
        }

        .service-card:hover:not(:disabled) {
          transform: translateY(-5px);
          border-color: #93c5fd;
          box-shadow:
            0 12px 25px
            rgba(37,99,235,.08);
        }

        .service-card.selected {
          border: 2px solid #2563eb;
          background:
            linear-gradient(
              180deg,
              #f0f6ff,
              #fff
            );
        }

        .service-card:disabled {
          cursor: not-allowed;
        }

        .service-card.selected:disabled {
          opacity: 1;
        }

        .service-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .service-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f1f5f9;
          color: #2563eb;
          font-size: 22px;
          font-weight: 800;
          transition: .2s ease;
        }

        .selected-icon {
          background: #dbeafe;
          transform: scale(1.05);
        }

        .radio {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #d8dee7;
          border-radius: 50%;
          color: white;
          font-size: 10px;
          font-weight: 800;
        }

        .radio.selected {
          border-color: #2563eb;
          background: #2563eb;
          animation: pulse 1.5s ease infinite;
        }

        .service-text h3 {
          margin: 17px 0 6px;
          font-size: 14px;
        }

        .service-text p {
          min-height: 34px;
          margin: 0;
          color: #7b8798;
          font-size: 10px;
          line-height: 1.5;
        }

        .service-action {
          margin-top: 18px;
          padding-top: 9px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #edf0f4;
          color: #8b96a5;
          font-size: 8px;
        }

        .service-action b {
          color: #2563eb;
          font-size: 17px;
          transition: .2s ease;
        }

        .service-card:hover:not(:disabled)
        .service-action b {
          transform: translateX(4px);
        }


        /* =====================================================
           TOKEN ACTION
        ===================================================== */

        .token-action {
          margin-top: 17px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          background: #f8fbff;
        }

        .selected-display {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .selected-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #e5efff;
          color: #2563eb;
          font-weight: 800;
        }

        .selected-display > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .selected-display span {
          color: #2563eb;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .selected-display strong {
          font-size: 12px;
        }

        .generate-token-button {
          min-width: 200px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          font-family: times, "Segoe UI", Arial, sans-serif;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: .2s ease;
        }
        

        .generate-token-button:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow:
            0 7px 17px
            rgba(37,99,235,.2);
        }

        .generate-token-button:disabled {
          background: #a8b3c2;
          cursor: not-allowed;
        }

        .button-loader {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }


        /* =====================================================
           QUEUE PANEL
        ===================================================== */

        .queue-panel {
          padding: 22px;
          border: 1px solid #e5eaf0;
          border-radius: 14px;
          background: white;
        }

        .queue-progress {
          margin-bottom: 22px;
        }

        .progress-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 9px;
        }

        .progress-top span {
          color: #94a3b8;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .progress-top strong {
          color: #2563eb;
          font-size: 10px;
        }

        .progress-track {
          height: 7px;
          overflow: hidden;
          border-radius: 10px;
          background: #edf1f5;
        }

        .progress-fill {
          width: 58%;
          height: 100%;
          border-radius: 10px;
          background:
            linear-gradient(
              90deg,
              #2563eb,
              #60a5fa
            );
          animation:
            progressGrow .8s ease;
        }

        .progress-fill.completed {
          width: 100%;
          background: #22c55e;
        }

        @keyframes progressGrow {
          from {
            width: 0;
          }
        }

        .progress-labels {
          margin-top: 7px;
          display: flex;
          justify-content: space-between;
          color: #a0aab8;
          font-size: 8px;
        }

        .queue-summary {
          padding-top: 20px;
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 15px;
          border-top: 1px solid #edf0f4;
        }

        .queue-summary div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .queue-summary span {
          color: #94a3b8;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .8px;
        }

        .queue-summary strong {
          font-size: 13px;
        }


        /* =====================================================
           EMPTY QUEUE
        ===================================================== */

        .empty-queue {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 1px solid #e5eaf0;
          border-radius: 14px;
          background: white;
        }

        .empty-illustration {
          width: 55px;
          height: 55px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 22px;
          font-weight: 800;
        }

        .empty-queue h3 {
          margin: 10px 0 4px;
          font-size: 14px;
        }

        .empty-queue p {
          margin: 0;
          color: #94a3b8;
          font-size: 10px;
        }


        /* =====================================================
           STEPS
        ===================================================== */

        .steps-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
        }

        .step {
          min-height: 175px;
          padding: 18px;
          border: 1px solid #e5eaf0;
          border-radius: 13px;
          background: white;
          transition: .2s ease;
        }

        .step:hover {
          transform: translateY(-4px);
          box-shadow:
            0 10px 22px
            rgba(15,23,42,.05);
        }

        .step-number {
          color: #2563eb;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .step-icon {
          margin-top: 10px;
          color: #2563eb;
          font-size: 22px;
          font-weight: 800;
        }

        .step h3 {
          margin: 10px 0 5px;
          font-size: 13px;
        }

        .step p {
          margin: 0;
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.5;
        }


        /* =====================================================
           FOOTER
        ===================================================== */

        .footer {
          padding-top: 22px;
          border-top: 1px solid #dfe5ed;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #94a3b8;
          font-size: 8px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-logo {
          width: 29px;
          height: 29px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #e8f0ff;
          color: #2563eb;
          font-weight: 800;
        }

        .footer-brand div:last-child {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .footer-brand strong {
          color: #475569;
          font-size: 11px;
        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 1050px) {

          .sidebar {
            width: 210px;
          }

          .main-area {
            width: calc(100% - 210px);
            margin-left: 210px;
          }

          .services-grid,
          .steps-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .token-card {
            grid-template-columns:
              1.5fr 1fr 1fr;
          }

          .token-stat:last-child {
            grid-column: 1 / -1;
            border-left: none;
            border-top: 1px solid rgba(255,255,255,.12);
            padding: 14px 0 0;
          }
        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 750px) {

          .sidebar {
            width: 68px;
            padding: 20px 9px;
          }

          .sidebar-brand {
            justify-content: center;
            padding: 0;
          }

          .sidebar-brand > div:last-child,
          .nav-label,
          .nav-item:not(.active)::after,
          .sidebar-user-info {
            display: none;
          }

          .nav-item {
            justify-content: center;
            padding: 0;
          }

          .nav-item.active {
            justify-content: center;
          }

          .sidebar-bottom {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .sidebar-user {
            margin-bottom: 12px;
          }

          .sidebar-logout {
            width: 42px;
            height: 38px;
            padding: 0;
            font-size: 0;
          }

          .sidebar-logout span {
            font-size: 15px;
          }

          .main-area {
            width: calc(100% - 68px);
            margin-left: 68px;
          }

          .top-header {
            padding: 0 18px;
          }

          .header-profile div:last-child,
          .notification-bell {
            display: none;
          }

          .content {
            width: 94%;
            padding-top: 20px;
          }

          .welcome-section {
            min-height: 175px;
            padding: 25px;
          }

          .welcome-section h2 {
            font-size: 27px;
          }

          .welcome-decoration {
            display: none;
          }

          .token-card {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .token-stat {
            padding: 14px 0 0;
            border-left: none;
            border-top: 1px solid rgba(255,255,255,.12);
          }

          .services-grid,
          .steps-grid {
            grid-template-columns: 1fr;
          }

          .token-action {
            flex-direction: column;
            align-items: stretch;
          }

          .generate-token-button {
            width: 100%;
          }

          .queue-summary {
            grid-template-columns: 1fr;
          }

          .footer {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }
        }


        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (max-width: 450px) {

          .sidebar {
            width: 58px;
          }

          .main-area {
            width: calc(100% - 58px);
            margin-left: 58px;
          }

          .sidebar-logo {
            width: 36px;
            height: 36px;
          }

          .content {
            width: 94%;
          }

          .welcome-section {
            border-radius: 14px;
          }

          .welcome-section h2 {
            font-size: 24px;
          }

          .top-header h1 {
            font-size: 17px;
          }

          .section-header h2 {
            font-size: 19px;
          }

          .token-card {
            padding: 20px;
          }

        }

      `}</style>

    </div>
  );
}