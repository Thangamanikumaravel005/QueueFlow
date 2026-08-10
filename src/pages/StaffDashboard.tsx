import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

interface QueueItem {
  id: number;
  tokenNumber: number;
  service: string;
  status: string;
  createdAt: string;
}

export default function StaffDashboard() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadQueue = async () => {
    try {
      setLoading(true);

      const data = await apiRequest("/Queue");

      setQueue(data as QueueItem[]);
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load queue"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const callNextCustomer = async () => {
    try {
      setMessage("");

      await apiRequest("/Queue/next", {
        method: "POST",
      });

      setMessage("Next customer called successfully.");
      await loadQueue();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to call next customer"
      );
    }
  };

  const completeService = async (id: number) => {
    try {
      setMessage("");

      await apiRequest(`/Queue/${id}/complete`, {
        method: "PUT",
      });

      setMessage("Service completed successfully.");
      await loadQueue();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete service"
      );
    }
  };

  if (loading) {
    return <div>Loading queue...</div>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Staff Dashboard</h1>

      {message && (
        <p>{message}</p>
      )}

      <button
        onClick={callNextCustomer}
        style={{
          padding: "10px 20px",
          marginBottom: "20px",
          cursor: "pointer",
        }}
      >
        Call Next Customer
      </button>

      {queue.length === 0 ? (
        <p>No customers in the queue.</p>
      ) : (
        <div>
          {queue.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginBottom: "10px",
                borderRadius: "8px",
              }}
            >
              <h3>
                Token #{item.tokenNumber}
              </h3>

              <p>
                Service: {item.service}
              </p>

              <p>
                Status: {item.status}
              </p>

              {item.status === "Serving" && (
                <button
                  onClick={() =>
                    completeService(item.id)
                  }
                  style={{
                    padding: "8px 15px",
                    cursor: "pointer",
                  }}
                >
                  Complete Service
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}