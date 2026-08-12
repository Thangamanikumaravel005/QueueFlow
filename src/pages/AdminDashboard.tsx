import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";


// ============================================================
// TYPES
// ============================================================

interface QueueItem {
  id: number;
  tokenNumber: number;
  service: string;
  status: string;
  createdAt: string;
  customerId?: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ApiResponse {
  message?: string;
  user?: User;
}


// ============================================================
// SERVICES
// ============================================================

const services = [
  "All Services",
  "Cash Deposit",
  "Cash Withdrawal",
  "Account Enquiry",
  "Loan Enquiry",
];


// ============================================================
// COMPONENT
// ============================================================

export default function AdminDashboard() {
  const navigate = useNavigate();


  // ==========================================================
  // QUEUE STATE
  // ==========================================================

  const [queue, setQueue] =
    useState<QueueItem[]>([]);

  const [queueLoading, setQueueLoading] =
    useState(true);

  const [queueError, setQueueError] =
    useState("");


  // ==========================================================
  // USER STATE
  // ==========================================================

  const [users, setUsers] =
    useState<User[]>([]);

  const [usersLoading, setUsersLoading] =
    useState(false);

  const [userError, setUserError] =
    useState("");

  const [userMessage, setUserMessage] =
    useState("");


  // ==========================================================
  // FILTER
  // ==========================================================

  const [selectedService, setSelectedService] =
    useState("All Services");


  // ==========================================================
  // GENERAL STATE
  // ==========================================================

 const [message, setMessage] =
  useState("");


  // ==========================================================
  // GET TOKEN
  // ==========================================================

  const getToken = () => {
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


  // ==========================================================
  // LOAD QUEUE
  // ==========================================================

  const loadQueue = async () => {
    try {
      setQueueError("");

      const token = getToken();

      if (!token) {
        return;
      }

      const response = await fetch(
        "http://localhost:5110/api/Queue",
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


      // Unauthorized
      if (
        response.status === 401 ||
        response.status === 403
      ) {
        sessionStorage.clear();

        navigate("/login", {
          replace: true,
        });

        return;
      }


      if (!response.ok) {
        throw new Error(
          "Unable to load queue data."
        );
      }


      const data =
        await response.json();


      setQueue(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {
      console.error(
        "Queue loading error:",
        err
      );

      setQueueError(
        err instanceof Error
          ? err.message
          : "Unable to load queue."
      );

    } finally {
      setQueueLoading(false);
    }
  };


  // ==========================================================
  // LOAD USERS
  // ==========================================================

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setUserError("");

      const token = getToken();

      if (!token) {
        return;
      }


      const response = await fetch(
        "http://localhost:5110/api/User",
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


      if (
        response.status === 401 ||
        response.status === 403
      ) {
        sessionStorage.clear();

        navigate("/login", {
          replace: true,
        });

        return;
      }


      if (!response.ok) {
        throw new Error(
          "Unable to load users."
        );
      }


      const data =
        await response.json();


      setUsers(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {
      console.error(
        "User loading error:",
        err
      );

      setUserError(
        err instanceof Error
          ? err.message
          : "Unable to load users."
      );

    } finally {
      setUsersLoading(false);
    }
  };


  // ==========================================================
  // CHANGE USER ROLE
  // ==========================================================

  const changeUserRole = async (
    id: number,
    role: string
  ) => {
    try {
      setUserError("");
      setUserMessage("");

      const token = getToken();

      if (!token) {
        return;
      }


      const response = await fetch(
        `http://localhost:5110/api/User/${id}/role`,
        {
          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            role,
          }),
        }
      );


      let data:
        ApiResponse = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }


      if (
        response.status === 401 ||
        response.status === 403
      ) {
        sessionStorage.clear();

        navigate("/login", {
          replace: true,
        });

        return;
      }


      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to change user role."
        );
      }


      setUserMessage(
        "User role updated successfully."
      );


      await loadUsers();

    } catch (err) {
      console.error(
        "Change role error:",
        err
      );

      setUserError(
        err instanceof Error
          ? err.message
          : "Unable to change user role."
      );
    }
  };


  // ==========================================================
  // DELETE USER
  // ==========================================================

  const deleteUser = async (
    id: number,
    name: string
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${name}?`
      );


    if (!confirmed) {
      return;
    }


    try {
      setUserError("");
      setUserMessage("");

      const token = getToken();

      if (!token) {
        return;
      }


      const response = await fetch(
        `http://localhost:5110/api/User/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",
          },
        }
      );


      let data:
        ApiResponse = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }


      if (
        response.status === 401 ||
        response.status === 403
      ) {
        sessionStorage.clear();

        navigate("/login", {
          replace: true,
        });

        return;
      }


      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete user."
        );
      }


      setUserMessage(
        "User deleted successfully."
      );


      await loadUsers();

    } catch (err) {
      console.error(
        "Delete user error:",
        err
      );

      setUserError(
        err instanceof Error
          ? err.message
          : "Unable to delete user."
      );
    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

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
    loadUsers();


    const interval =
      window.setInterval(() => {
        loadQueue();
        loadUsers();
      }, 5000);


    return () => {
      window.clearInterval(
        interval
      );
    };

  }, []);


  // ==========================================================
  // FILTERED QUEUE
  // ==========================================================

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
          item.service.toLowerCase() ===
          selectedService.toLowerCase()
      );

    }, [
      queue,
      selectedService,
    ]);


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalTokens =
    filteredQueue.length;


  const waitingCount =
    filteredQueue.filter(
      (item) =>
        item.status.toLowerCase() ===
        "waiting"
    ).length;


  const servingCount =
    filteredQueue.filter(
      (item) =>
        item.status.toLowerCase() ===
        "serving"
    ).length;


  const completedCount =
    filteredQueue.filter(
      (item) =>
        item.status.toLowerCase() ===
        "completed"
    ).length;


  const cancelledCount =
    filteredQueue.filter(
      (item) =>
        item.status.toLowerCase() ===
        "cancelled"
    ).length;


  // ==========================================================
  // USER STATISTICS
  // ==========================================================

  const totalUsers =
    users.length;


  const customerCount =
    users.filter(
      (user) =>
        user.role.toLowerCase() ===
        "customer"
    ).length;


  const staffCount =
    users.filter(
      (user) =>
        user.role.toLowerCase() ===
        "staff"
    ).length;


  const adminCount =
    users.filter(
      (user) =>
        user.role.toLowerCase() ===
        "admin"
    ).length;


  // ==========================================================
  // SERVICE STATISTICS
  // ==========================================================

  const getServiceCount = (
    service: string,
    status?: string
  ) => {
    return queue.filter(
      (item) => {
        const serviceMatch =
          item.service.toLowerCase() ===
          service.toLowerCase();

        if (!status) {
          return serviceMatch;
        }

        return (
          serviceMatch &&
          item.status.toLowerCase() ===
            status.toLowerCase()
        );
      }
    ).length;
  };


  // ==========================================================
  // ICON
  // ==========================================================

  const getServiceIcon =
    (service: string) => {
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


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {
    sessionStorage.clear();

    navigate("/login", {
      replace: true,
    });
  };


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="admin-page">


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
              Admin Panel
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
            href="#services"
            className="nav-link"
          >
            📈 Services
          </a>

          <a
            href="#queue"
            className="nav-link"
          >
            🎫 Queue Activity
          </a>

          <a
            href="#users"
            className="nav-link"
          >
            👥 Users
          </a>

          <Link
            to="/"
            className="nav-link"
          >
            🏠 Home
          </Link>

        </nav>


        <div className="sidebar-bottom">

          <div className="admin-profile">

            <div className="avatar">
              A
            </div>

            <div>

              <strong>
                Administrator
              </strong>

              <span>
                Admin
              </span>

            </div>

          </div>


          <button
            className="logout-button"
            onClick={logout}
          >
            🚪 Logout
          </button>

        </div>

      </aside>


      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="main-content">


        {/* HEADER */}

        <header
          className="header"
          id="dashboard"
        >

          <div>

            <span className="eyebrow">
              SYSTEM ADMINISTRATION
            </span>

            <h1>
              Admin Dashboard
            </h1>

            <p>
              Monitor QueueFlow operations
              and manage users.
            </p>

          </div>


          <div className="header-actions">

            <button
              className="refresh-button"
              onClick={() => {
                loadQueue();
                loadUsers();
              }}
            >
              ↻ Refresh
            </button>

          </div>

        </header>


        {/* GENERAL ERROR */}

        {queueError && (
          <div className="alert error-alert">

            <span>
              ⚠
            </span>

            {queueError}

            <button
              onClick={() =>
                setQueueError("")
              }
            >
              ×
            </button>

          </div>
        )}


        {message && (
          <div className="alert success-alert">

            <span>
              ✓
            </span>

            {message}

            <button
              onClick={() =>
                setMessage("")
              }
            >
              ×
            </button>

          </div>
        )}


        {/* ==================================================
            QUEUE STATISTICS
        ================================================== */}

        <section className="stats-grid">


          <div className="stat-card">

            <div className="stat-icon blue">
              🎫
            </div>

            <div>

              <span>
                Total Tokens
              </span>

              <strong>
                {totalTokens}
              </strong>

              <small>
                Queue records
              </small>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon orange">
              ⏳
            </div>

            <div>

              <span>
                Waiting
              </span>

              <strong>
                {waitingCount}
              </strong>

              <small>
                Customers waiting
              </small>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon green">
              👤
            </div>

            <div>

              <span>
                Serving
              </span>

              <strong>
                {servingCount}
              </strong>

              <small>
                Currently serving
              </small>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon purple">
              ✓
            </div>

            <div>

              <span>
                Completed
              </span>

              <strong>
                {completedCount}
              </strong>

              <small>
                Completed services
              </small>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon red">
              ✕
            </div>

            <div>

              <span>
                Cancelled
              </span>

              <strong>
                {cancelledCount}
              </strong>

              <small>
                Cancelled tokens
              </small>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon cyan">
              👥
            </div>

            <div>

              <span>
                Total Users
              </span>

              <strong>
                {totalUsers}
              </strong>

              <small>
                Registered users
              </small>

            </div>

          </div>


        </section>


        {/* ==================================================
            SERVICE FILTER
        ================================================== */}

        <section className="filter-card">

          <div>

            <span className="section-label">
              QUEUE FILTER
            </span>

            <h2>
              Service Overview
            </h2>

            <p>
              Select a service to view
              detailed queue statistics.
            </p>

          </div>


          <select
            value={selectedService}
            onChange={(event) =>
              setSelectedService(
                event.target.value
              )
            }
          >

            {services.map(
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
            SERVICE CARDS
        ================================================== */}

        <section
          className="section"
          id="services"
        >

          <div className="section-header">

            <div>

              <span className="section-label">
                SERVICES
              </span>

              <h2>
                Service Statistics
              </h2>

              <p>
                Queue status for each
                banking service.
              </p>

            </div>

          </div>


          <div className="service-grid">

            {services
              .slice(1)
              .map(
                (service) => (

                  <div
                    className="service-card"
                    key={service}
                  >

                    <div className="service-card-top">

                      <div className="service-icon">
                        {getServiceIcon(
                          service
                        )}
                      </div>

                      <div>

                        <h3>
                          {service}
                        </h3>

                        <span>
                          {
                            getServiceCount(
                              service
                            )
                          }{" "}
                          total tokens
                        </span>

                      </div>

                    </div>


                    <div className="service-stats">

                      <div>

                        <span>
                          Waiting
                        </span>

                        <strong>
                          {
                            getServiceCount(
                              service,
                              "Waiting"
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Serving
                        </span>

                        <strong>
                          {
                            getServiceCount(
                              service,
                              "Serving"
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Completed
                        </span>

                        <strong>
                          {
                            getServiceCount(
                              service,
                              "Completed"
                            )
                          }
                        </strong>

                      </div>

                    </div>

                  </div>

                )
              )}

          </div>

        </section>


        {/* ==================================================
            USER SUMMARY
        ================================================== */}

        <section className="user-summary">

          <div>

            <span className="section-label">
              USERS
            </span>

            <h2>
              User Overview
            </h2>

          </div>


          <div className="user-summary-grid">

            <div>

              <span>
                👤 Customers
              </span>

              <strong>
                {customerCount}
              </strong>

            </div>


            <div>

              <span>
                🧑‍💼 Staff
              </span>

              <strong>
                {staffCount}
              </strong>

            </div>


            <div>

              <span>
                🛡 Admins
              </span>

              <strong>
                {adminCount}
              </strong>

            </div>

          </div>

        </section>


        {/* ==================================================
            QUEUE ACTIVITY
        ================================================== */}

        <section
          className="section"
          id="queue"
        >

          <div className="section-header">

            <div>

              <span className="section-label">
                QUEUE
              </span>

              <h2>
                Queue Activity
              </h2>

              <p>
                Recent queue activity.
              </p>

            </div>


            <span className="record-count">
              {filteredQueue.length} Records
            </span>

          </div>


          {queueLoading ? (

            <div className="loading">
              Loading queue...
            </div>

          ) : filteredQueue.length === 0 ? (

            <div className="empty">
              <div>
                📭
              </div>

              <h3>
                No queue records
              </h3>

              <p>
                There are no queue records
                for the selected service.
              </p>
            </div>

          ) : (

            <div className="table-wrapper">

              <table className="queue-table">

                <thead>

                  <tr>

                    <th>
                      Token
                    </th>

                    <th>
                      Service
                    </th>

                    <th>
                      Customer
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Created
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredQueue
                    .slice()
                    .reverse()
                    .map(
                      (item) => (

                        <tr
                          key={item.id}
                        >

                          <td>

                            <strong>
                              #{item.tokenNumber}
                            </strong>

                          </td>


                          <td>

                            <div className="table-service">

                              <span>
                                {getServiceIcon(
                                  item.service
                                )}
                              </span>

                              {item.service}

                            </div>

                          </td>


                          <td>

                            {item.customerId
                              ? `Customer #${item.customerId}`
                              : "—"}

                          </td>


                          <td>

                            <span
                              className={
                                `status-badge status-${item.status.toLowerCase()}`
                              }
                            >
                              {item.status}
                            </span>

                          </td>


                          <td>

                            {new Date(
                              item.createdAt
                            ).toLocaleString(
                              [],
                              {
                                dateStyle:
                                  "short",
                                timeStyle:
                                  "short",
                              }
                            )}

                          </td>

                        </tr>

                      )
                    )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* ==================================================
            USER MANAGEMENT
        ================================================== */}

        <section
          className="user-management"
          id="users"
        >

          <div className="user-header">

            <div>

              <span className="section-label">
                ADMINISTRATION
              </span>

              <h2>
                User Management
              </h2>

              <p>
                View and manage QueueFlow
                users and their roles.
              </p>

            </div>


            <button
              className="refresh-users"
              onClick={loadUsers}
              disabled={usersLoading}
            >
              {usersLoading
                ? "Loading..."
                : "↻ Refresh Users"}
            </button>

          </div>


          {userMessage && (

            <div className="user-success">

              ✓ {userMessage}

              <button
                onClick={() =>
                  setUserMessage("")
                }
              >
                ×
              </button>

            </div>

          )}


          {userError && (

            <div className="user-error">

              ⚠ {userError}

              <button
                onClick={() =>
                  setUserError("")
                }
              >
                ×
              </button>

            </div>

          )}


          {usersLoading ? (

            <div className="users-loading">
              Loading users...
            </div>

          ) : users.length === 0 ? (

            <div className="users-empty">

              <div>
                👥
              </div>

              <h3>
                No users found
              </h3>

            </div>

          ) : (

            <div className="users-table-wrapper">

              <table className="users-table">

                <thead>

                  <tr>

                    <th>
                      ID
                    </th>

                    <th>
                      Name
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {users.map(
                    (user) => (

                      <tr
                        key={user.id}
                      >

                        <td>
                          #{user.id}
                        </td>


                        <td>

                          <strong>
                            {user.name}
                          </strong>

                        </td>


                        <td>
                          {user.email}
                        </td>


                        <td>

                          <span
                            className={
                              `role-badge role-${user.role.toLowerCase()}`
                            }
                          >
                            {user.role}
                          </span>

                        </td>


                        <td>

                          <div className="user-actions">

                            <select
                              value={user.role}
                              onChange={(event) =>
                                changeUserRole(
                                  user.id,
                                  event.target.value
                                )
                              }
                            >

                              <option value="Customer">
                                Customer
                              </option>

                              <option value="Staff">
                                Staff
                              </option>

                              <option value="Admin">
                                Admin
                              </option>

                            </select>


                            <button
                              className="delete-user"
                              onClick={() =>
                                deleteUser(
                                  user.id,
                                  user.name
                                )
                              }
                            >
                              🗑 Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer>

          <span>
            © 2026 QueueFlow
          </span>

          <span>
            Admin Management System
          </span>

        </footer>


      </main>


      {/* ====================================================
          CSS
      ==================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f5f7fb;
        }

        .admin-page {
          min-height: 100vh;
          display: flex;
          background: #f5f7fb;
          color: #172033;
          font-family:
            Inter,
            Arial,
            sans-serif;
        }


        /* ==================================================
           SIDEBAR
        ================================================== */

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

        .admin-profile {
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
          background: #ede9fe;
          color: #6d28d9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .admin-profile div:last-child {
          display: flex;
          flex-direction: column;
        }

        .admin-profile strong {
          font-size: 13px;
        }

        .admin-profile span {
          color: #8b95a7;
          font-size: 11px;
          margin-top: 3px;
        }

        .logout-button {
          width: 100%;
          border: 0;
          background: #fff1f2;
          color: #dc2626;
          padding: 11px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
        }

        .logout-button:hover {
          background: #ffe4e6;
        }


        /* ==================================================
           MAIN
        ================================================== */

        .main-content {
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

        .refresh-button {
          padding: 10px 16px;
          background: white;
          border: 1px solid #dbe1ea;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
        }

        .refresh-button:hover {
          background: #f8fafc;
        }


        /* ==================================================
           ALERTS
        ================================================== */

        .alert {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 13px 16px;
          border-radius: 10px;
          margin-bottom: 18px;
          font-size: 13px;
        }

        .alert button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 18px;
          cursor: pointer;
        }

        .error-alert {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .success-alert {
          background: #ecfdf5;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }


        /* ==================================================
           STATS
        ================================================== */

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e8ecf2;
          border-radius: 15px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-icon {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          flex-shrink: 0;
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

        .stat-icon.red {
          background: #fff1f2;
        }

        .stat-icon.cyan {
          background: #ecfeff;
        }

        .stat-card > div:last-child {
          display: flex;
          flex-direction: column;
        }

        .stat-card span {
          color: #8a94a6;
          font-size: 10px;
        }

        .stat-card strong {
          font-size: 24px;
          margin-top: 2px;
        }

        .stat-card small {
          color: #9aa3b2;
          font-size: 9px;
        }


        /* ==================================================
           FILTER
        ================================================== */

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

        .section-label {
          color: #2563eb;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .filter-card h2 {
          margin: 5px 0;
          font-size: 18px;
        }

        .filter-card p {
          margin: 0;
          color: #8a94a6;
          font-size: 12px;
        }

        .filter-card select {
          min-width: 240px;
          padding: 11px 14px;
          border: 1px solid #dbe1ea;
          border-radius: 9px;
          background: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }


        /* ==================================================
           SECTION
        ================================================== */

        .section {
          background: white;
          border: 1px solid #e8ecf2;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h2 {
          margin: 5px 0;
          font-size: 19px;
        }

        .section-header p {
          margin: 0;
          color: #8a94a6;
          font-size: 12px;
        }


        /* ==================================================
           SERVICES
        ================================================== */

        .service-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
        }

        .service-card {
          border: 1px solid #e8ecf2;
          border-radius: 13px;
          padding: 18px;
          background: white;
        }

        .service-card:hover {
          border-color: #bfdbfe;
        }

        .service-card-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .service-icon {
          width: 45px;
          height: 45px;
          border-radius: 11px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .service-card h3 {
          margin: 0;
          font-size: 13px;
        }

        .service-card-top span {
          display: block;
          margin-top: 4px;
          color: #8a94a6;
          font-size: 10px;
        }

        .service-stats {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
          margin-top: 18px;
        }

        .service-stats div {
          background: #f8fafc;
          border-radius: 8px;
          padding: 9px;
          display: flex;
          flex-direction: column;
        }

        .service-stats span {
          color: #8a94a6;
          font-size: 9px;
        }

        .service-stats strong {
          font-size: 17px;
          margin-top: 3px;
        }


        /* ==================================================
           USER SUMMARY
        ================================================== */

        .user-summary {
          background:
            linear-gradient(
              135deg,
              #f8faff,
              #ffffff
            );
          border: 1px solid #e0e7ff;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .user-summary h2 {
          margin: 5px 0 18px;
          font-size: 19px;
        }

        .user-summary-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 14px;
        }

        .user-summary-grid div {
          background: white;
          border: 1px solid #e8ecf2;
          border-radius: 11px;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-summary-grid span {
          color: #64748b;
          font-size: 12px;
        }

        .user-summary-grid strong {
          font-size: 22px;
        }


        /* ==================================================
           TABLE
        ================================================== */

        .record-count {
          background: #eff6ff;
          color: #2563eb;
          padding: 7px 11px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .queue-table {
          width: 100%;
          min-width: 700px;
          border-collapse: collapse;
        }

        .queue-table th {
          text-align: left;
          background: #f8fafc;
          color: #64748b;
          padding: 12px;
          font-size: 10px;
          text-transform: uppercase;
        }

        .queue-table td {
          padding: 13px 12px;
          border-bottom: 1px solid #edf0f4;
          color: #475569;
          font-size: 12px;
        }

        .queue-table tr:hover {
          background: #fafcff;
        }

        .table-service {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .status-waiting {
          background: #fef3c7;
          color: #92400e;
        }

        .status-serving {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .status-completed {
          background: #dcfce7;
          color: #15803d;
        }

        .status-cancelled {
          background: #fee2e2;
          color: #b91c1c;
        }


        /* ==================================================
           USER MANAGEMENT
        ================================================== */

        .user-management {
          background: white;
          border: 1px solid #e8ecf2;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .user-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .user-header h2 {
          margin: 5px 0;
          font-size: 19px;
        }

        .user-header p {
          margin: 0;
          color: #8a94a6;
          font-size: 12px;
        }

        .refresh-users {
          border: 1px solid #dbe1ea;
          background: white;
          padding: 10px 15px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
        }

        .refresh-users:hover {
          background: #f8fafc;
        }

        .refresh-users:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .user-success,
        .user-error {
          padding: 12px 14px;
          border-radius: 9px;
          margin-bottom: 15px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-success {
          background: #ecfdf5;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .user-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .user-success button,
        .user-error button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 17px;
          cursor: pointer;
        }

        .users-loading,
        .users-empty {
          text-align: center;
          padding: 35px;
          color: #8a94a6;
        }

        .users-empty div {
          font-size: 30px;
        }

        .users-empty h3 {
          color: #334155;
          margin: 8px 0;
        }

        .users-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .users-table {
          width: 100%;
          min-width: 750px;
          border-collapse: collapse;
        }

        .users-table th {
          text-align: left;
          padding: 12px;
          background: #f8fafc;
          color: #64748b;
          font-size: 10px;
          text-transform: uppercase;
        }

        .users-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #edf0f4;
          color: #475569;
          font-size: 12px;
        }

        .users-table tr:hover {
          background: #fafcff;
        }

        .role-badge {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }

        .role-admin {
          background: #ede9fe;
          color: #6d28d9;
        }

        .role-staff {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .role-customer {
          background: #dcfce7;
          color: #15803d;
        }

        .user-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-actions select {
          padding: 7px 9px;
          border: 1px solid #dbe1ea;
          border-radius: 7px;
          background: white;
          font-size: 10px;
          cursor: pointer;
        }

        .delete-user {
          padding: 7px 10px;
          border: 1px solid #fecaca;
          border-radius: 7px;
          background: #fff1f2;
          color: #dc2626;
          cursor: pointer;
          font-size: 10px;
        }

        .delete-user:hover {
          background: #ffe4e6;
        }


        /* ==================================================
           LOADING / EMPTY
        ================================================== */

        .loading,
        .empty {
          text-align: center;
          padding: 40px;
          color: #8a94a6;
        }

        .empty div {
          font-size: 35px;
        }

        .empty h3 {
          color: #334155;
          margin: 8px 0;
        }

        .empty p {
          margin: 0;
          font-size: 12px;
        }


        /* ==================================================
           FOOTER
        ================================================== */

        footer {
          display: flex;
          justify-content: space-between;
          color: #9aa3b2;
          font-size: 11px;
        }


        /* ==================================================
           RESPONSIVE
        ================================================== */

        @media (max-width: 1250px) {

          .stats-grid {
            grid-template-columns:
              repeat(3, 1fr);
          }

          .service-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

        }


        @media (max-width: 850px) {

          .sidebar {
            width: 70px;
            padding: 15px 8px;
          }

          .brand-text,
          .admin-profile div:last-child,
          .logout-button {
            display: none;
          }

          .brand {
            justify-content: center;
          }

          .nav-link {
            text-align: center;
            font-size: 0;
          }

          .main-content {
            margin-left: 70px;
            width: calc(100% - 70px);
            padding: 22px 16px;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .filter-card,
          .header,
          .user-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .filter-card select {
            width: 100%;
          }

        }


        @media (max-width: 600px) {

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .service-grid {
            grid-template-columns: 1fr;
          }

          .user-summary-grid {
            grid-template-columns: 1fr;
          }

          footer {
            flex-direction: column;
            gap: 6px;
          }

        }

      `}</style>

    </div>
  );
}