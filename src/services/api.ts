const API_BASE_URL = "http://localhost:5110/api";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = sessionStorage.getItem("token");

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401) {
    sessionStorage.clear();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (response.status === 403) {
    throw new Error("Access denied");
  }

  const text = await response.text();

  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data
    ) {
      throw new Error(
        String(
          (data as { message: unknown }).message
        )
      );
    }

    throw new Error(
      typeof data === "string"
        ? data
        : "API request failed"
    );
  }

  return data;
}