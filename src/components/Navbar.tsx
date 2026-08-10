import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold"
        >
          QueueFlow
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6">

          <Link
            to="/"
            className="hover:text-blue-200"
          >
            Home
          </Link>

          {!user && (
            <Link
              to="/login"
              className="hover:text-blue-200"
            >
              Login
            </Link>
          )}

          {/* Customer */}
          {user?.role === "customer" && (
            <Link
              to="/customer"
              className="hover:text-blue-200"
            >
              Dashboard
            </Link>
          )}

          {/* Staff */}
          {user?.role === "staff" && (
            <Link
              to="/staff"
              className="hover:text-blue-200"
            >
              Dashboard
            </Link>
          )}

          {/* Admin */}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="hover:text-blue-200"
            >
              Dashboard
            </Link>
          )}

          {/* User information */}
          {user && (
            <>
              <div className="text-sm border-l border-blue-400 pl-6">
                <p className="font-semibold">
                  {user.name}
                </p>

                <p className="text-blue-200 capitalize">
                  {user.role}
                </p>
              </div>

              <button
                onClick={logout}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50"
              >
                Logout
              </button>
            </>
          )}

        </div>

      </div>
    </nav>
  );
}

export default Navbar;