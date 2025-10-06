export async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = { "Content-Type": "application/json" };

  const token = localStorage.getItem("token");
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = { headers: { ...defaultHeaders, ...options.headers }, ...options };
  const url = endpoint.startsWith("http") ? endpoint : endpoint;

  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Erro na requisição");
  }

  return data;
}
