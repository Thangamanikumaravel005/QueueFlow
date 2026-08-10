import { useEffect, useState } from "react";

interface QueueItem {
  id: number;
  tokenNumber: number;
  service: string;
  status: string;
  createdAt: string;
}

function CustomerDashboard() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Token saved by this browser session
  const [customerToken, setCustomerToken] =
    useState<number | null>(null);

  const API_URL = "http://localhost:5110/api/Queue";

  // Load queue from backend
  const loadQueue = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load queue.");
      }

      const data: QueueItem[] = await response.json();

      setQueue(data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect to the Queue server."
      );
    } finally {
      setLoading(false);
    }
  };

  // Get customer's token from sessionStorage
  useEffect(() => {
    const savedToken =
      sessionStorage.getItem("customerToken");

    if (savedToken) {
      setCustomerToken(Number(savedToken));
    }

    loadQueue();

    const interval = setInterval(() => {
      loadQueue();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Find customer's queue item
  const customer = queue.find(
    (item) =>
      item.tokenNumber === customerToken
  );

  // Find currently serving customer
  const servingCustomers = queue.filter(
    (item) => item.status === "Serving"
  );

  const nowServing =
    servingCustomers.length > 0
      ? servingCustomers[
          servingCustomers.length - 1
        ]
      : null;

  // Customers waiting before this customer
  const peopleAhead =
    customer && customer.status === "Waiting"
      ? queue.filter(
          (item) =>
            item.status === "Waiting" &&
            item.tokenNumber <
              customer.tokenNumber
        ).length
      : 0;

  const estimatedWait = peopleAhead * 3;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">

        <div className="text-center">

          <div className="text-2xl font-bold text-blue-600">
            Loading Queue...
          </div>

          <p className="text-gray-500 mt-2">
            Please wait.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">

      <div className="max-w-6xl mx-auto">

        {/* Header */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-gray-800">
            Customer Dashboard
          </h1>

          <p className="text-gray-600 mt-2">
            Track your queue position in real time.
          </p>

        </div>


        {/* Error */}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}


        {/* No Token */}

        {!customerToken && (

          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">

            <h2 className="text-2xl font-bold text-gray-800">
              No Active Token
            </h2>

            <p className="text-gray-600 mt-3">
              Please get a queue token from the home page.
            </p>

            <a
              href="/"
              className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Get Queue Token
            </a>

          </div>

        )}


        {/* Token Not Found */}

        {customerToken && !customer && (

          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">

            <h2 className="text-2xl font-bold text-gray-800">
              Token Not Found
            </h2>

            <p className="text-gray-600 mt-3">
              Token A-{customerToken} could not be found in the queue.
            </p>

            <button
              onClick={loadQueue}
              className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Refresh
            </button>

          </div>

        )}


        {/* Customer Queue */}

        {customer && (

          <>
            {/* Token */}

            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">

              <p className="text-gray-500 font-medium">
                YOUR TOKEN
              </p>

              <h2 className="text-6xl font-bold text-blue-600 mt-3">
                A-{customer.tokenNumber}
              </h2>

              <p className="text-gray-600 mt-3">
                {customer.service}
              </p>

              <span
                className={`inline-block mt-4 px-4 py-2 rounded-full font-semibold ${
                  customer.status === "Waiting"
                    ? "bg-yellow-100 text-yellow-700"
                    : customer.status === "Serving"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {customer.status}
              </span>

            </div>


            {/* Statistics */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Now Serving */}

              <div className="bg-green-50 rounded-2xl p-6 text-center">

                <p className="text-gray-600 font-medium">
                  Now Serving
                </p>

                <h3 className="text-4xl font-bold text-green-600 mt-3">
                  {nowServing
                    ? `A-${nowServing.tokenNumber}`
                    : "None"}
                </h3>

              </div>


              {/* People Ahead */}

              <div className="bg-yellow-50 rounded-2xl p-6 text-center">

                <p className="text-gray-600 font-medium">
                  People Ahead
                </p>

                <h3 className="text-4xl font-bold text-yellow-600 mt-3">
                  {customer.status === "Waiting"
                    ? peopleAhead
                    : 0}
                </h3>

              </div>


              {/* Estimated Wait */}

              <div className="bg-purple-50 rounded-2xl p-6 text-center">

                <p className="text-gray-600 font-medium">
                  Estimated Wait
                </p>

                <h3 className="text-4xl font-bold text-purple-600 mt-3">
                  {customer.status === "Waiting"
                    ? `${estimatedWait} min`
                    : "Now"}
                </h3>

              </div>

            </div>


            {/* Status Message */}

            <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">

              {customer.status === "Waiting" && (

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">

                  <h3 className="text-xl font-bold text-blue-700">
                    Please Wait
                  </h3>

                  <p className="text-blue-600 mt-2">
                    There are{" "}
                    <strong>
                      {peopleAhead}
                    </strong>{" "}
                    customer
                    {peopleAhead !== 1
                      ? "s"
                      : ""}{" "}
                    ahead of you.
                  </p>

                </div>

              )}

              {customer.status === "Serving" && (

                <div className="bg-green-100 border border-green-300 rounded-xl p-5 text-center">

                  <h3 className="text-xl font-bold text-green-700">
                    🎉 It's Your Turn!
                  </h3>

                  <p className="text-green-600 mt-2">
                    Please proceed to the service counter.
                  </p>

                </div>

              )}

              {customer.status === "Completed" && (

                <div className="bg-gray-100 border border-gray-300 rounded-xl p-5 text-center">

                  <h3 className="text-xl font-bold text-gray-700">
                    Service Completed
                  </h3>

                  <p className="text-gray-600 mt-2">
                    Thank you for using QueueFlow.
                  </p>

                </div>

              )}

            </div>


            {/* Refresh */}

            <div className="text-center mt-8">

              <button
                onClick={loadQueue}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Refresh Queue
              </button>

              <p className="text-gray-500 text-sm mt-3">
                Queue automatically refreshes every 5 seconds.
              </p>

            </div>

          </>
        )}

      </div>

    </div>
  );
}

export default CustomerDashboard;