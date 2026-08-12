import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

interface QueueItem {
  id: number;
  tokenNumber: number;
  service: string;
  status: string;
  createdAt: string;
  customerId?: number;
  peopleAhead?: number;
}

interface QueueResponse {
  message?: string;
  queue?: QueueItem;
}

const API_URL =
  "http://localhost:5110/api";

const SERVICES = [
  "All Services",
  "Cash Deposit",
  "Cash Withdrawal",
  "Account Enquiry",
  "Loan Enquiry",
];

export default function StaffDashboard() {
  const navigate = useNavigate();

  const [queue, setQueue] =
    useState<QueueItem[]>([]);

  const [selectedService, setSelectedService] =
    useState("All Services");

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  // =========================================================
  // GET AUTH TOKEN
  // =========================================================

  const getToken = (): string | null => {
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
  // LOAD QUEUE
  // =========================================================

  const loadQueue = useCallback(
    async () => {
      try {
        const token =
          sessionStorage.getItem("token");

        if (!token) {
          navigate("/login", {
            replace: true,
          });

          return;
        }

        const response =
          await fetch(
            `${API_URL}/Queue`,
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


        // ---------------------------------------------------
        // AUTHENTICATION EXPIRED
        // ---------------------------------------------------

        if (
          response.status === 401
        ) {
          sessionStorage.clear();

          navigate("/login", {
            replace: true,
          });

          return;
        }


        // ---------------------------------------------------
        // FORBIDDEN
        // ---------------------------------------------------

        if (
          response.status === 403
        ) {
          setError(
            "You do not have permission to view the queue."
          );

          return;
        }


        // ---------------------------------------------------
        // OTHER ERROR
        // ---------------------------------------------------

        if (!response.ok) {
          throw new Error(
            "Unable to load queue."
          );
        }


        // ---------------------------------------------------
        // READ JSON
        // ---------------------------------------------------

        const data =
          await response.json();

        if (
          Array.isArray(data)
        ) {
          setQueue(data);
        } else if (
          Array.isArray(
            data?.queue
          )
        ) {
          setQueue(data.queue);
        } else {
          setQueue([]);
        }

        setError("");

      } catch (err) {
        console.error(
          "Queue loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load queue."
        );

      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );


  // =========================================================
  // CALL NEXT CUSTOMER
  // =========================================================

  const callNext = async () => {
    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      const token =
        getToken();

      if (!token) {
        return;
      }

      let url =
        `${API_URL}/Queue/next`;

      let body:
        | string
        | undefined;


      // -----------------------------------------------------
      // ALL SERVICES
      // -----------------------------------------------------

      if (
        selectedService !==
        "All Services"
      ) {
        url =
          `${API_URL}/Queue/next-by-service`;

        body =
          JSON.stringify({
            service:
              selectedService,
          });
      }


      // -----------------------------------------------------
      // REQUEST
      // -----------------------------------------------------

      const response =
        await fetch(url, {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",
          },

          ...(body
            ? { body }
            : {}),
        });


      // -----------------------------------------------------
      // RESPONSE
      // -----------------------------------------------------

      let data:
        QueueResponse = {};

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data =
          await response.json();
      }


      // -----------------------------------------------------
      // AUTH
      // -----------------------------------------------------

      if (
        response.status === 401
      ) {
        sessionStorage.clear();

        navigate("/login", {
          replace: true,
        });

        return;
      }


      // -----------------------------------------------------
      // FORBIDDEN
      // -----------------------------------------------------

      if (
        response.status === 403
      ) {
        throw new Error(
          data.message ||
            "You are not authorized to call the next customer."
        );
      }


      // -----------------------------------------------------
      // NO WAITING CUSTOMER
      // -----------------------------------------------------

      if (
        response.status === 404
      ) {
        throw new Error(
          data.message ||
            "No customers are waiting."
        );
      }


      // -----------------------------------------------------
      // CURRENT CUSTOMER EXISTS
      // -----------------------------------------------------

      if (
        response.status === 409
      ) {
        throw new Error(
          data.message ||
            "A customer is already being served."
        );
      }


      // -----------------------------------------------------
      // OTHER ERROR
      // -----------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to call next customer."
        );
      }


      // -----------------------------------------------------
      // CHECK QUEUE DATA
      // -----------------------------------------------------

      if (!data.queue) {
        throw new Error(
          "Queue information was not returned."
        );
      }


      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      setMessage(
        `Token #${data.queue.tokenNumber} (${data.queue.service}) is now being served.`
      );

      await loadQueue();

    } catch (err) {
      console.error(
        "Call next error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to call next customer."
      );

    } finally {
      setActionLoading(false);
    }
  };


  // =========================================================
  // COMPLETE SERVICE
  // =========================================================

  const completeService = async (
    id: number
  ) => {
    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      const token =
        getToken();

      if (!token) {
        return;
      }

      const response =
        await fetch(
          `${API_URL}/Queue/${id}/complete`,
          {
            method: "PUT",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
          }
        );


      let data:
        QueueResponse = {};

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data =
          await response.json();
      }


      if (
        response.status === 401
      ) {
        sessionStorage.clear();

        navigate("/login", {
          replace: true,
        });

        return;
      }


      if (
        response.status === 403
      ) {
        throw new Error(
          data.message ||
            "You are not authorized to complete this service."
        );
      }


      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to complete service."
        );
      }


      setMessage(
        "Customer service completed successfully."
      );

      await loadQueue();

    } catch (err) {
      console.error(
        "Complete service error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete service."
      );

    } finally {
      setActionLoading(false);
    }
  };


  // =========================================================
  // CANCEL QUEUE
  // =========================================================

  const cancelQueue = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this queue token?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setMessage("");

      const token =
        getToken();

      if (!token) {
        return;
      }

      const response =
        await fetch(
          `${API_URL}/Queue/${id}/cancel`,
          {
            method: "PUT",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
          }
        );


      let data:
        QueueResponse = {};

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data =
          await response.json();
      }


      if (
        response.status === 401
      ) {
        sessionStorage.clear();

        navigate("/login", {
          replace: true,
        });

        return;
      }


      if (
        response.status === 403
      ) {
        throw new Error(
          data.message ||
            "You are not authorized to cancel this token."
        );
      }


      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to cancel token."
        );
      }


      setMessage(
        "Queue token cancelled successfully."
      );

      await loadQueue();

    } catch (err) {
      console.error(
        "Cancel error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel token."
      );

    } finally {
      setActionLoading(false);
    }
  };


  // =========================================================
  // INITIAL LOAD + AUTO REFRESH
  // =========================================================

  useEffect(() => {
    const token =
      sessionStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    loadQueue();

    const interval =
      window.setInterval(
        () => {
          loadQueue();
        },
        5000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    navigate,
    loadQueue,
  ]);


  // =========================================================
  // FILTER QUEUE
  // =========================================================

  const filteredQueue =
    useMemo(() => {
      if (
        selectedService ===
        "All Services"
      ) {
        return queue;
      }

      return queue.filter(
        (item) =>
          item.service
            .toLowerCase() ===
          selectedService
            .toLowerCase()
      );
    }, [
      queue,
      selectedService,
    ]);


  // =========================================================
  // WAITING CUSTOMERS
  // =========================================================

  const waiting =
    filteredQueue.filter(
      (item) =>
        item.status
          .toLowerCase() ===
        "waiting"
    );


  // =========================================================
  // CURRENT SERVING CUSTOMER
  // =========================================================

  const serving =
    queue.find(
      (item) =>
        item.status
          .toLowerCase() ===
        "serving"
    );


  // =========================================================
  // COMPLETED
  // =========================================================

  const completed =
    filteredQueue.filter(
      (item) =>
        item.status
          .toLowerCase() ===
        "completed"
    );


  // =========================================================
  // SERVICE ICON
  // =========================================================

  const getServiceIcon = (
    service: string
  ) => {
    switch (
      service.toLowerCase()
    ) {
      case "cash deposit":
        return "💰";

      case "cash withdrawal":
        return "💳";

      case "account enquiry":
        return "🔍";

      case "loan enquiry":
        return "🏦";

      default:
        return "🎫";
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
  // RENDER
  // =========================================================

  return (
    <div className="staff-page">

      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            Q
          </div>

          <div className="brand-text">

            <h2>
              QueueFlow
            </h2>

            <span>
              Staff Portal
            </span>

          </div>

        </div>


        <nav>

          <a
            href="#dashboard"
            className="nav-link active"
          >
            📊 Dashboard
          </a>

          <a
            href="#current"
            className="nav-link"
          >
            👤 Current Customer
          </a>

          <a
            href="#queue"
            className="nav-link"
          >
            🎫 Queue
          </a>

          <Link
            to="/"
            className="nav-link"
          >
            🏠 Home
          </Link>

        </nav>


        <div className="sidebar-bottom">

          <div className="staff-user">

            <div className="avatar">
              S
            </div>

            <div className="staff-details">

              <strong>
                Staff
              </strong>

              <span>
                Queue Manager
              </span>

            </div>

          </div>


          <button
            className="logout"
            onClick={logout}
          >
            🚪 Logout
          </button>

        </div>

      </aside>


      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="main">

        {/* HEADER */}

        <header
          className="header"
          id="dashboard"
        >

          <div>

            <span className="eyebrow">
              QUEUE MANAGEMENT
            </span>

            <h1>
              Staff Dashboard
            </h1>

            <p>
              Manage and process customers
              efficiently.
            </p>

          </div>


          <button
            className="refresh"
            onClick={loadQueue}
            disabled={loading}
          >
            ↻ Refresh
          </button>

        </header>


        {/* SUCCESS MESSAGE */}

        {message && (
          <div className="success">

            <span>
              ✓
            </span>

            <span>
              {message}
            </span>

            <button
              onClick={() =>
                setMessage("")
              }
            >
              ×
            </button>

          </div>
        )}


        {/* ERROR MESSAGE */}

        {error && (
          <div className="error">

            <span>
              ⚠
            </span>

            <span>
              {error}
            </span>

            <button
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>

          </div>
        )}


        {/* ==================================================
            SERVICE FILTER
        ================================================== */}

        <section className="filter-card">

          <div className="filter-heading">

            <div className="filter-icon">
              🔎
            </div>

            <div>

              <h2>
                Service Filter
              </h2>

              <p>
                Select a service to manage
                its queue.
              </p>

            </div>

          </div>


          <select
            value={selectedService}
            onChange={(event) =>
              setSelectedService(
                event.target.value
              )
            }
          >

            {SERVICES.map(
              (service) => (
                <option
                  key={service}
                  value={service}
                >
                  {service}
                </option>
              )
            )}

          </select>

        </section>


        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section className="stats">

          <div className="stat">

            <div className="stat-icon blue">
              🎫
            </div>

            <div>

              <span>
                Total
              </span>

              <strong>
                {filteredQueue.length}
              </strong>

              <small>
                Queue tokens
              </small>

            </div>

          </div>


          <div className="stat">

            <div className="stat-icon orange">
              ⏳
            </div>

            <div>

              <span>
                Waiting
              </span>

              <strong>
                {waiting.length}
              </strong>

              <small>
                Customers waiting
              </small>

            </div>

          </div>


          <div className="stat">

            <div className="stat-icon green">
              👤
            </div>

            <div>

              <span>
                Serving
              </span>

              <strong>
                {serving ? 1 : 0}
              </strong>

              <small>
                Current customer
              </small>

            </div>

          </div>


          <div className="stat">

            <div className="stat-icon purple">
              ✓
            </div>

            <div>

              <span>
                Completed
              </span>

              <strong>
                {completed.length}
              </strong>

              <small>
                Completed services
              </small>

            </div>

          </div>

        </section>


        {/* ==================================================
            CURRENT CUSTOMER
        ================================================== */}

        <section
          className="section"
          id="current"
        >

          <div className="section-header">

            <div>

              <h2>
                Current Customer
              </h2>

              <p>
                Customer currently being served
              </p>

            </div>

            <span className="live">
              ● LIVE
            </span>

          </div>


          {serving ? (

            <div className="current-card">

              <div className="big-token">
                #{serving.tokenNumber}
              </div>


              <div className="current-info">

                <span className="label">
                  CURRENTLY SERVING
                </span>

                <h3>
                  Token #{serving.tokenNumber}
                </h3>

                <p>

                  {getServiceIcon(
                    serving.service
                  )}

                  {" "}

                  {serving.service}

                </p>

              </div>


              <button
                className="complete"
                onClick={() =>
                  completeService(
                    serving.id
                  )
                }
                disabled={
                  actionLoading
                }
              >
                {actionLoading
                  ? "Processing..."
                  : "✓ Complete Service"}
              </button>

            </div>

          ) : (

            <div className="no-customer">

              <div>
                🪑
              </div>

              <h3>
                No customer is being served
              </h3>

              <p>
                Call the next waiting
                customer.
              </p>

            </div>

          )}

        </section>


        {/* ==================================================
            CALL NEXT
        ================================================== */}

        <section className="call-card">

          <div>

            <span className="label">
              NEXT ACTION
            </span>

            <h2>
              Call Next Customer
            </h2>

            <p>
              {selectedService ===
              "All Services"
                ? "Call the oldest waiting customer."
                : `Call the next ${selectedService} customer.`}
            </p>

          </div>


          <button
            className="call-button"
            onClick={callNext}
            disabled={
              actionLoading ||
              !!serving ||
              waiting.length === 0
            }
          >
            {actionLoading
              ? "Processing..."
              : "📢 Call Next"}
          </button>

        </section>


        {/* ==================================================
            WAITING QUEUE
        ================================================== */}

        <section
          className="section"
          id="queue"
        >

          <div className="section-header">

            <div>

              <h2>
                Waiting Queue
              </h2>

              <p>
                Customers waiting for service
              </p>

            </div>

            <span className="waiting-count">
              {waiting.length} Waiting
            </span>

          </div>


          {loading ? (

            <div className="loading">

              <div className="spinner" />

              Loading queue...

            </div>

          ) : waiting.length === 0 ? (

            <div className="no-customer">

              <div>
                📭
              </div>

              <h3>
                No customers waiting
              </h3>

              <p>
                No waiting customers for
                the selected service.
              </p>

            </div>

          ) : (

            <div className="queue-list">

              {waiting.map(
                (item, index) => (

                  <div
                    className="queue-item"
                    key={item.id}
                  >

                    <div className="position">
                      {index + 1}
                    </div>


                    <div className="queue-service">

                      <div className="service-icon">
                        {getServiceIcon(
                          item.service
                        )}
                      </div>

                      <div>

                        <strong>
                          Token #
                          {item.tokenNumber}
                        </strong>

                        <span>
                          {item.service}
                        </span>

                      </div>

                    </div>


                    <div className="created">

                      <small>
                        Created
                      </small>

                      <span>
                        {new Date(
                          item.createdAt
                        ).toLocaleTimeString(
                          [],
                          {
                            hour:
                              "2-digit",
                            minute:
                              "2-digit",
                          }
                        )}
                      </span>

                    </div>


                    <span className="status">
                      ● Waiting
                    </span>


                    <button
                      className="cancel"
                      onClick={() =>
                        cancelQueue(
                          item.id
                        )
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      Cancel
                    </button>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* ==================================================
            SERVICE OVERVIEW
        ================================================== */}

        <section className="section">

          <div className="section-header">

            <div>

              <h2>
                Service Overview
              </h2>

              <p>
                Click a service to filter
                the queue.
              </p>

            </div>

          </div>


          <div className="service-grid">

            {SERVICES
              .slice(1)
              .map(
                (service) => {

                  const count =
                    queue.filter(
                      (item) =>
                        item.service
                          .toLowerCase() ===
                          service.toLowerCase() &&
                        item.status
                          .toLowerCase() ===
                          "waiting"
                    ).length;

                  return (

                    <button
                      key={service}
                      className={
                        selectedService ===
                        service
                          ? "service-card selected"
                          : "service-card"
                      }
                      onClick={() =>
                        setSelectedService(
                          service
                        )
                      }
                    >

                      <div className="service-icon">
                        {getServiceIcon(
                          service
                        )}
                      </div>

                      <div>

                        <strong>
                          {service}
                        </strong>

                        <span>
                          {count} waiting
                        </span>

                      </div>

                    </button>

                  );
                }
              )}

          </div>

        </section>


        {/* FOOTER */}

        <footer>

          <span>
            © 2026 QueueFlow
          </span>

          <span>
            Staff Queue Management System
          </span>

        </footer>

      </main>


      {/* =====================================================
          CSS
      ===================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f5f7fb;
        }

        .staff-page {
          min-height: 100vh;
          display: flex;
          background: #f5f7fb;
          color: #172033;
          font-family:
            Inter,
            Arial,
            sans-serif;
        }

        /* SIDEBAR */

        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 250px;
          padding: 25px 18px;
          background: white;
          border-right: 1px solid #e8ecf2;
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px 32px;
        }

        .brand-logo {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
        }

        .brand h2 {
          margin: 0;
          font-size: 20px;
        }

        .brand span {
          color: #8b95a7;
          font-size: 11px;
        }

        nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nav-link {
          text-decoration: none;
          color: #697386;
          padding: 13px 15px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
        }

        .nav-link:hover,
        .nav-link.active {
          background: #eef4ff;
          color: #2563eb;
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .staff-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 8px;
          border-top: 1px solid #edf0f4;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #dbeafe;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .staff-details {
          display: flex;
          flex-direction: column;
        }

        .staff-user strong {
          font-size: 13px;
        }

        .staff-user span {
          color: #8b95a7;
          font-size: 11px;
          margin-top: 3px;
        }

        .logout {
          width: 100%;
          border: 0;
          background: #fff1f2;
          color: #dc2626;
          padding: 11px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
        }

        .logout:hover {
          background: #ffe4e6;
        }

        /* MAIN */

        .main {
          margin-left: 250px;
          width: calc(100% - 250px);
          padding: 34px 40px 50px;
        }

        .header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 25px;
        }

        .eyebrow {
          color: #2563eb;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .header h1 {
          margin: 6px 0;
          font-size: 30px;
        }

        .header p {
          margin: 0;
          color: #7b8495;
          font-size: 14px;
        }

        .refresh {
          padding: 10px 16px;
          background: white;
          border: 1px solid #dbe1ea;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
        }

        .refresh:disabled {
          opacity: 0.5;
        }

        /* MESSAGES */

        .success,
        .error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 13px 16px;
          border-radius: 10px;
          margin-bottom: 18px;
          font-size: 13px;
        }

        .success {
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          color: #15803d;
        }

        .error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .success button,
        .error button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 18px;
          cursor: pointer;
        }

        /* FILTER */

        .filter-card {
          background: white;
          border: 1px solid #e8ecf2;
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .filter-heading {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .filter-icon {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          background: #eef4ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .filter-heading h2 {
          margin: 0;
          font-size: 16px;
        }

        .filter-heading p {
          margin: 4px 0 0;
          color: #8a94a6;
          font-size: 11px;
        }

        .filter-card select {
          min-width: 240px;
          padding: 11px 14px;
          border: 1px solid #dbe1ea;
          border-radius: 9px;
          background: white;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          outline: none;
        }

        .filter-card select:focus {
          border-color: #2563eb;
        }

        /* STATS */

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat {
          background: white;
          border: 1px solid #e8ecf2;
          border-radius: 15px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .stat-icon.blue {
          background: #eff6ff;
        }

        .stat-icon.orange {
          background: #fff7ed;
        }

        .stat-icon.green {
          background: #ecfdf5;
        }

        .stat-icon.purple {
          background: #f5f3ff;
        }

        .stat div:last-child {
          display: flex;
          flex-direction: column;
        }

        .stat span {
          color: #8a94a6;
          font-size: 12px;
        }

        .stat strong {
          font-size: 27px;
        }

        .stat small {
          color: #9aa3b2;
          font-size: 10px;
        }

        /* SECTION */

        .section {
          background: white;
          border: 1px solid #e8ecf2;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .section-header p {
          margin: 5px 0 0;
          color: #8a94a6;
          font-size: 12px;
        }

        .live {
          background: #ecfdf5;
          color: #15803d;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
        }

        /* CURRENT CUSTOMER */

        .current-card {
          display: flex;
          align-items: center;
          gap: 22px;
          padding: 24px;
          background:
            linear-gradient(
              135deg,
              #eff6ff,
              #f8faff
            );
          border: 1px solid #dbeafe;
          border-radius: 14px;
        }

        .big-token {
          width: 85px;
          height: 85px;
          border-radius: 20px;
          background: #2563eb;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
          font-weight: 800;
        }

        .current-info {
          flex: 1;
        }

        .label {
          color: #2563eb;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .current-info h3 {
          margin: 5px 0;
          font-size: 20px;
        }

        .current-info p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .complete {
          border: 0;
          padding: 12px 18px;
          border-radius: 9px;
          background: #16a34a;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .complete:hover {
          background: #15803d;
        }

        .complete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* NO CUSTOMER */

        .no-customer {
          text-align: center;
          padding: 40px;
          color: #8a94a6;
        }

        .no-customer > div {
          font-size: 35px;
        }

        .no-customer h3 {
          color: #334155;
          margin: 8px 0;
        }

        .no-customer p {
          margin: 0;
          font-size: 12px;
        }

        /* CALL NEXT */

        .call-card {
          background:
            linear-gradient(
              135deg,
              #eff6ff,
              #f8faff
            );
          border: 1px solid #dbeafe;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .call-card h2 {
          margin: 6px 0;
          font-size: 19px;
        }

        .call-card p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
        }

        .call-button {
          border: 0;
          padding: 13px 24px;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .call-button:hover {
          background: #1d4ed8;
        }

        .call-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* WAITING QUEUE */

        .waiting-count {
          background: #fff7ed;
          color: #c2410c;
          padding: 7px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .queue-item {
          display: grid;
          grid-template-columns:
            50px
            minmax(220px, 1fr)
            120px
            100px
            75px;
          align-items: center;
          gap: 15px;
          padding: 14px;
          border: 1px solid #edf0f4;
          border-radius: 12px;
        }

        .position {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #eef4ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }

        .queue-service {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .service-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .queue-service div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .queue-service strong {
          font-size: 13px;
        }

        .queue-service span {
          color: #8a94a6;
          font-size: 10px;
        }

        .created {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .created small {
          color: #9aa3b2;
          font-size: 9px;
        }

        .created span {
          color: #64748b;
          font-size: 11px;
        }

        .status {
          background: #fef3c7;
          color: #92400e;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          width: fit-content;
        }

        .cancel {
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #dc2626;
          padding: 7px 10px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 11px;
        }

        .cancel:hover {
          background: #ffe4e6;
        }

        .cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* SERVICE OVERVIEW */

        .service-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 12px;
        }

        .service-card {
          border: 1px solid #e8ecf2;
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 11px;
          text-align: left;
          cursor: pointer;
          transition: .2s;
        }

        .service-card:hover {
          border-color: #bfdbfe;
          transform: translateY(-2px);
        }

        .service-card.selected {
          border: 2px solid #2563eb;
          background: #f8fbff;
        }

        .service-card div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .service-card strong {
          font-size: 11px;
        }

        .service-card span {
          color: #8a94a6;
          font-size: 10px;
        }

        /* LOADING */

        .loading {
          text-align: center;
          padding: 40px;
          color: #8a94a6;
        }

        .spinner {
          width: 30px;
          height: 30px;
          margin: 0 auto 12px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation:
            spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* FOOTER */

        footer {
          display: flex;
          justify-content: space-between;
          color: #9aa3b2;
          font-size: 11px;
        }

        /* RESPONSIVE */

        @media (max-width: 1100px) {

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .service-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .queue-item {
            grid-template-columns:
              45px
              1fr
              90px
              80px;
          }

          .created {
            display: none;
          }
        }


        @media (max-width: 750px) {

          .sidebar {
            width: 70px;
            padding: 15px 8px;
          }

          .brand-text,
          .staff-details,
          .logout {
            display: none;
          }

          .brand {
            justify-content: center;
          }

          .nav-link {
            text-align: center;
            font-size: 0;
          }

          .main {
            margin-left: 70px;
            width: calc(100% - 70px);
            padding: 22px 16px;
          }

          .header,
          .filter-card,
          .current-card,
          .call-card,
          .section-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .filter-card select {
            width: 100%;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .current-card {
            text-align: center;
          }

          .current-info {
            width: 100%;
          }

          .queue-item {
            display: flex;
            flex-wrap: wrap;
          }

          .queue-service {
            flex: 1;
            min-width: 150px;
          }

          .service-grid {
            grid-template-columns: 1fr;
          }

          footer {
            flex-direction: column;
            gap: 5px;
          }
        }

      `}</style>

    </div>
  );
}