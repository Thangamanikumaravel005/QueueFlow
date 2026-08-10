import { useEffect, useState } from "react";

interface QueueItem {
  id: number;
  tokenNumber: number;
  service: string;
  status: string;
  createdAt: string;
}

function AdminDashboard() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:5110/api/Queue";

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load queue");
      }

      const data: QueueItem[] = await response.json();

      setQueue(data);
    } catch (error) {
      console.error("Admin queue error:", error);

      setError(
        "Unable to connect to the Queue server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();

    const interval = setInterval(() => {
      loadQueue();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const waiting = queue.filter(
    (item) => item.status === "Waiting"
  );

  const serving = queue.filter(
    (item) => item.status === "Serving"
  );

  const completed = queue.filter(
    (item) => item.status === "Completed"
  );

  const totalCustomers = queue.length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto">

        {/* Header */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>

            <p className="text-gray-600 mt-2">
              Monitor the QueueFlow system.
            </p>

          </div>

          <button
            onClick={loadQueue}
            className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Refresh Data
          </button>

        </div>


        {/* Error */}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}


        {/* Statistics */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Total */}

          <div className="bg-white rounded-2xl shadow-md p-6">

            <p className="text-gray-500">
              Total Customers
            </p>

            <h2 className="text-4xl font-bold text-blue-600 mt-3">
              {totalCustomers}
            </h2>

          </div>


          {/* Waiting */}

          <div className="bg-white rounded-2xl shadow-md p-6">

            <p className="text-gray-500">
              Waiting
            </p>

            <h2 className="text-4xl font-bold text-yellow-500 mt-3">
              {waiting.length}
            </h2>

          </div>


          {/* Serving */}

          <div className="bg-white rounded-2xl shadow-md p-6">

            <p className="text-gray-500">
              Serving
            </p>

            <h2 className="text-4xl font-bold text-green-600 mt-3">
              {serving.length}
            </h2>

          </div>


          {/* Completed */}

          <div className="bg-white rounded-2xl shadow-md p-6">

            <p className="text-gray-500">
              Completed
            </p>

            <h2 className="text-4xl font-bold text-purple-600 mt-3">
              {completed.length}
            </h2>

          </div>

        </div>


        {/* Current Serving */}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">

          <h2 className="text-xl font-bold text-gray-800 mb-5">
            Currently Serving
          </h2>

          {serving.length === 0 ? (

            <p className="text-gray-500">
              No customer is currently being served.
            </p>

          ) : (

            <div className="space-y-3">

              {serving.map((customer) => (

                <div
                  key={customer.id}
                  className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4"
                >

                  <div>

                    <p className="text-2xl font-bold text-green-700">
                      A-{customer.tokenNumber}
                    </p>

                    <p className="text-gray-600">
                      {customer.service}
                    </p>

                  </div>

                  <span className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold">
                    Serving
                  </span>

                </div>

              ))}

            </div>

          )}

        </div>


        {/* Queue Table */}

        <div className="bg-white rounded-2xl shadow-lg p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-bold text-gray-800">
              All Queue Records
            </h2>

            <span className="text-sm text-gray-500">
              Auto-refresh: 5 seconds
            </span>

          </div>


          {loading ? (

            <div className="text-center py-10 text-gray-500">
              Loading queue data...
            </div>

          ) : queue.length === 0 ? (

            <div className="text-center py-10 text-gray-500">
              No queue records found.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="border-b">

                    <th className="text-left p-4">
                      Token
                    </th>

                    <th className="text-left p-4">
                      Service
                    </th>

                    <th className="text-left p-4">
                      Status
                    </th>

                    <th className="text-left p-4">
                      Created
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {queue.map((customer) => (

                    <tr
                      key={customer.id}
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="p-4 font-bold text-blue-600">
                        A-{customer.tokenNumber}
                      </td>

                      <td className="p-4 text-gray-700">
                        {customer.service}
                      </td>

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            customer.status === "Waiting"
                              ? "bg-yellow-100 text-yellow-700"
                              : customer.status === "Serving"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {customer.status}
                        </span>

                      </td>

                      <td className="p-4 text-gray-500">

                        {new Date(
                          customer.createdAt
                        ).toLocaleString()}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;