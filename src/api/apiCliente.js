export async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' };

  const config = {
    headers: { ...defaultHeaders, ...options.headers },
    ...options,
  };

  // Se o endpoint já começar com "http", não adiciona nada
  const url = endpoint.startsWith('http') ? endpoint : endpoint;

  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Erro na requisição');
  }

  return data;
}
