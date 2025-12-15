// src/redux/postsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

const API_URL = "/posts";

// --- AÇÕES ASSÍNCRONAS (THUNKS) ---

/**
 * Busca todos os posts (Feed principal).
 */
export const fetchPosts = createAsyncThunk(
  "posts/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(API_URL);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar posts");
    }
  }
);

/**
 * Busca posts de um usuário específico.
 */
export const fetchPostsByUser = createAsyncThunk(
  "posts/fetchByUser",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}?usuarioId=${userId}`);
      return { userId, posts: res.data }; // Retorna userId para normalização
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar posts do usuário");
    }
  }
);

/**
 * Cria um novo post com opcional upload de arquivo (usando FormData).
 * Define o estado 'uploading' para rastrear o progresso.
 */
export const createPostWithUpload = createAsyncThunk(
  "posts/createWithUpload",
  async ({ postData, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      // Adicionar arquivo se existir
      if (file) {
        formData.append("media", file);
      }
      
      // Adicionar dados do post
      Object.keys(postData).forEach((key) => {
        formData.append(key, postData[key]);
      });

      const res = await api.post(API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Importante para FormData
        },
      });
      
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.response?.data?.error || "Erro ao criar post");
    }
  }
);

/**
 * Cria um novo post (versão simplificada para posts apenas de texto).
 */
export const createPost = createAsyncThunk(
  "posts/create",
  async (novoPost, { rejectWithValue }) => {
    try {
      const res = await api.post(API_URL, novoPost);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao criar post");
    }
  }
);

/**
 * Atualiza um post existente.
 */
export const updatePost = createAsyncThunk(
  "posts/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`${API_URL}/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao atualizar post");
    }
  }
);

/**
 * Exclui um post.
 */
export const deletePost = createAsyncThunk(
  "posts/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      return id; // Retorna o ID para remover do estado
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao excluir post");
    }
  }
);

// --- SLICE E REDUCERS ---

const postsSlice = createSlice({
  name: "posts",
  initialState: {
    lista: [],
    byUser: {},          // Cache de posts por usuário: { userId: [posts] }
    loading: false,      // Status de carregamento para buscas (fetch)
    uploading: false,    // Status de carregamento para criação/upload de mídia
    uploadProgress: 0,   // Progresso do upload (reservado para futuras implementações)
    error: null,
  },
  reducers: {
    /**
     * Adiciona ou atualiza um post localmente no topo da lista.
     */
    addPost(state, action) {
      const post = action.payload;
      const id = String(post._id || post.id);
      
      // Atualiza/Insere na lista geral
      const exists = state.lista.findIndex(p => String(p._id || p.id) === id);
      
      if (exists === -1) {
        state.lista.unshift(post);
      } else {
        state.lista[exists] = post;
      }
      
      // Atualiza/Insere no byUser
      const uid = post.usuarioId || post.author || post.userId;
      if (uid) {
        state.byUser[uid] = state.byUser[uid] || [];
        const userIdx = state.byUser[uid].findIndex(p => String(p._id || p.id) === id);
        
        if (userIdx === -1) {
          state.byUser[uid].unshift(post);
        } else {
          state.byUser[uid][userIdx] = post;
        }
      }
    },

    /**
     * Sobrescreve a lista geral de posts.
     */
    setPosts(state, action) {
      state.lista = action.payload || [];
    },
    
    /**
     * Limpa a mensagem de erro.
     */
    clearPostError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetchPosts ---
      .addCase(fetchPosts.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.lista = action.payload; // Sobrescreve a lista principal
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // --- fetchPostsByUser ---
      .addCase(fetchPostsByUser.fulfilled, (state, action) => {
        const { userId, posts } = action.payload;
        state.byUser[userId] = posts; // Cacheia a lista específica do usuário
      })

      // --- createPostWithUpload (Pending/Rejected - Controla 'uploading') ---
      .addCase(createPostWithUpload.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(createPostWithUpload.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload || action.error?.message;
      })

      // --- createPost and createPostWithUpload (Fulfilled - Lógica de inserção) ---
      .addCase(createPostWithUpload.fulfilled, (state, action) => {
        state.uploading = false; // Finaliza o upload
        handlePostCreation(state, action);
      })
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        handlePostCreation(state, action);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // --- updatePost ---
      .addCase(updatePost.fulfilled, (state, action) => {
        const updated = action.payload;
        const id = String(updated._id || updated.id);

        // Atualiza na lista geral
        const idx = state.lista.findIndex((p) => String(p._id || p.id) === id);
        if (idx !== -1) state.lista[idx] = updated;
        
        // Atualiza no byUser
        const uid = updated.usuarioId || updated.author || updated.userId;
        if (uid && state.byUser[uid]) {
          const i = state.byUser[uid].findIndex(p => String(p._id || p.id) === id);
          if (i !== -1) state.byUser[uid][i] = updated;
        }
      })

      // --- deletePost ---
      .addCase(deletePost.fulfilled, (state, action) => {
        const id = String(action.payload);
        
        // Remove da lista geral
        state.lista = state.lista.filter((p) => String(p._id || p.id) !== id);
        
        // Remove de todas as listas byUser
        for (const k in state.byUser) {
          state.byUser[k] = state.byUser[k].filter((p) => String(p._id || p.id) !== id);
        }
      });
  },
});

// Lógica reutilizável para criação de posts (fullfilled)
function handlePostCreation(state, action) {
  const created = action.payload;
  const id = String(created._id || created.id);

  // Atualiza/Insere no topo da lista geral
  const exists = state.lista.findIndex(p => String(p._id || p.id) === id);
  if (exists === -1) {
    state.lista.unshift(created);
  } else {
    state.lista[exists] = created;
  }
  
  // Atualiza/Insere no topo da lista byUser
  const uid = created.usuarioId || created.author || created.userId;
  if (uid) {
    state.byUser[uid] = state.byUser[uid] || [];
    const idx = state.byUser[uid].findIndex(p => String(p._id || p.id) === id);
    
    if (idx === -1) {
      state.byUser[uid].unshift(created);
    } else {
      state.byUser[uid][idx] = created;
    }
  }
}

export const { addPost, setPosts, clearPostError } = postsSlice.actions;
export default postsSlice.reducer;

// --- SELECTORS ---

export const selectAllPosts = (state) => state.posts.lista || [];
export const selectPostsByUser = (userId) => (state) => state.posts.byUser[userId] || [];
export const selectPostById = (id) => (state) => 
  state.posts.lista.find((p) => String(p._id || p.id) === String(id));
export const selectPostsLoading = (state) => state.posts.loading;
export const selectPostsUploading = (state) => state.posts.uploading;
export const selectPostsError = (state) => state.posts.error;