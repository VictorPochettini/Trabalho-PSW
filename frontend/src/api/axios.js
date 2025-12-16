// src/api/axios.js
/**
 * Configuração da instância Axios para chamadas à API backend.
 * 
 * Esta configuração cria uma instância personalizada do Axios com:
 * - URL base definida para o servidor backend[](http://localhost:5000).
 * - Cabeçalhos padrão para JSON.
 * - Interceptor de request: Adiciona automaticamente o token de autenticação (Bearer) de localStorage a cada requisição.
 * - Interceptor de response: Trata erros 401 (não autorizado), podendo ser expandido para logout automático.
 * 
 * Uso: Importe e use esta instância para todas as chamadas API no frontend, ex.:
 * import api from './api/axios';
 * api.get('/usuarios').then(...);
 * 
 * @module api/axios
 */

import axios from "axios";

// Define a URL base da API (pode ser movida para .env para ambientes diferentes)
const BASE_URL = "http://localhost:5000";

/**
 * Instância Axios configurada.
 * @type {import('axios').AxiosInstance}
 */
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Interceptor de requisições: Adiciona token de autenticação automaticamente.
 * 
 * Este interceptor verifica se há um token no localStorage e o adiciona ao header Authorization como Bearer.
 * Se não houver token, a requisição prossegue sem autenticação.
 * 
 * @param {import('axios').InternalAxiosRequestConfig} config - Configuração da requisição.
 * @returns {import('axios').InternalAxiosRequestConfig} Configuração atualizada.
 */
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // Erro não crítico: ignora e prossegue (ex.: localStorage indisponível).
  }
  return config;
}, (error) => Promise.reject(error));

/**
 * Interceptor de respostas: Trata erros de autenticação (401).
 * 
 * Se a resposta for 401 (token inválido/expirado), pode ser usado para disparar logout global.
 * Atualmente, apenas rejeita o erro; expanda com lógica de store (ex.: Redux) se necessário.
 * 
 * @param {import('axios').AxiosResponse} res - Resposta bem-sucedida.
 * @returns {import('axios').AxiosResponse} Resposta inalterada.
 * @param {import('axios').AxiosError} err - Erro na resposta.
 * @returns {Promise<never>} Rejeita o erro.
 */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // TODO: Implemente logout automático aqui, ex.: dispatch(logout()) se usando Redux.
      // console.warn("Token inválido/expirado");
    }
    return Promise.reject(err);
  }
);

export default api;