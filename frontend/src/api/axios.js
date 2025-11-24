// src/api/axios.js
import axios from "axios";

const BASE_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Adiciona token automaticamente a cada requisição, pegando do localStorage
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // não crítico
  }
  return config;
}, (error) => Promise.reject(error));

// Opcional: intercepta respostas 401 para logout automático
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // você pode despachar logout global aqui se usar redux-thunk middleware com store importado
      // console.warn("Token inválido/expirado");
    }
    return Promise.reject(err);
  }
);

export default api;
