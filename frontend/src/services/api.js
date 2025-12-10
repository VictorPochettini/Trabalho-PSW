// src/services/api.js
/**
 * API Service
 * Centraliza todas as chamadas para o backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

/**
 * Helper para fazer requisições autenticadas
 */
const fetchWithAuth = async (url, options = {}, token = null) => {
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Se não for FormData, adicionar Content-Type
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Erro HTTP: ${response.status}`);
  }

  // Se for 204 No Content, retornar null
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

/**
 * API de Posts
 */
export const postsAPI = {
  /**
   * Criar post com upload de arquivo (imagem ou áudio)
   */
  createWithUpload: async (postData, file, token) => {
    const formData = new FormData();
    
    // Adicionar arquivo
    if (file) {
      formData.append("media", file);
    }
    
    // Adicionar dados do post
    Object.keys(postData).forEach((key) => {
      formData.append(key, postData[key]);
    });

    return fetchWithAuth("/posts", {
      method: "POST",
      body: formData,
    }, token);
  },

  /**
   * Criar post de texto (sem arquivo)
   */
  createText: async (postData, token) => {
    return fetchWithAuth("/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    }, token);
  },

  /**
   * Buscar todos os posts
   */
  getAll: async () => {
    return fetchWithAuth("/posts");
  },

  /**
   * Buscar post por ID
   */
  getById: async (id) => {
    return fetchWithAuth(`/posts/${id}`);
  },

  /**
   * Atualizar post
   */
  update: async (id, updates, token) => {
    return fetchWithAuth(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }, token);
  },

  /**
   * Deletar post
   */
  delete: async (id, token) => {
    return fetchWithAuth(`/posts/${id}`, {
      method: "DELETE",
    }, token);
  },
};

/**
 * API de Usuários
 */
export const usuariosAPI = {
  getAll: async () => {
    return fetchWithAuth("/usuarios");
  },

  getById: async (id) => {
    return fetchWithAuth(`/usuarios/${id}`);
  },

  update: async (id, updates, token) => {
    return fetchWithAuth(`/usuarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }, token);
  },
};

/**
 * API de Autenticação
 */
export const authAPI = {
  register: async (userData) => {
    return fetchWithAuth("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    return fetchWithAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  refresh: async (refreshToken) => {
    return fetchWithAuth("/api/auth/token", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout: async (token) => {
    return fetchWithAuth("/api/auth/logout", {
      method: "POST",
    }, token);
  },
};

/**
 * API de Comentários
 */
export const comentariosAPI = {
  getByPost: async (postId) => {
    return fetchWithAuth(`/comentarios?postId=${postId}`);
  },

  create: async (comentarioData, token) => {
    return fetchWithAuth("/comentarios", {
      method: "POST",
      body: JSON.stringify(comentarioData),
    }, token);
  },

  delete: async (id, token) => {
    return fetchWithAuth(`/comentarios/${id}`, {
      method: "DELETE",
    }, token);
  },
};

/**
 * API de Avaliações
 */
export const avaliacoesAPI = {
  getStats: async (postId) => {
    return fetchWithAuth(`/avaliacoes/stats/${postId}`);
  },

  getUserRating: async (usuarioId, postId) => {
    return fetchWithAuth(`/avaliacoes/user/${usuarioId}/post/${postId}`);
  },

  create: async (avaliacaoData, token) => {
    return fetchWithAuth("/avaliacoes", {
      method: "POST",
      body: JSON.stringify(avaliacaoData),
    }, token);
  },

  delete: async (usuarioId, postId, token) => {
    return fetchWithAuth(`/avaliacoes/user/${usuarioId}/post/${postId}`, {
      method: "DELETE",
    }, token);
  },
};

/**
 * API de Seguidores
 */
export const seguidoresAPI = {
  follow: async (seguidoId, token) => {
    return fetchWithAuth("/seguidores", {
      method: "POST",
      body: JSON.stringify({ seguidoId }),
    }, token);
  },

  unfollow: async (seguidoId, token) => {
    return fetchWithAuth(`/seguidores/${seguidoId}`, {
      method: "DELETE",
    }, token);
  },

  getFollowers: async (usuarioId) => {
    return fetchWithAuth(`/seguidores/followers/${usuarioId}`);
  },

  getFollowing: async (usuarioId) => {
    return fetchWithAuth(`/seguidores/following/${usuarioId}`);
  },

  checkFollowing: async (seguidorId, seguidoId) => {
    return fetchWithAuth(`/seguidores/check/${seguidorId}/${seguidoId}`);
  },
};

export default {
  posts: postsAPI,
  usuarios: usuariosAPI,
  auth: authAPI,
  comentarios: comentariosAPI,
  avaliacoes: avaliacoesAPI,
  seguidores: seguidoresAPI,
};
