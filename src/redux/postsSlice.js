// src/redux/postsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/posts";

// Buscar todos os posts
export const fetchPosts = createAsyncThunk(
  "posts/fetchAll",
  async () => {
    const res = await axios.get(API_URL);
    return res.data;
  }
);

// Adicionar um post (data incluída automaticamente)
export const addPost = createAsyncThunk(
  "posts/add",
  async (novoPost) => {
    const postComData = {
      ...novoPost,
      data: new Date().toISOString()
    };
    const res = await axios.post(API_URL, postComData);
    return res.data;
  }
);

// ✅ Remover um post
export const deletePost = createAsyncThunk(
  "posts/delete",
  async (id) => {
    // json-server: DELETE /posts/:id
    await axios.delete(`${API_URL}/${id}`);
    // retornamos o id para facilitar remover do estado
    return id;
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState: {
    lista: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchPosts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.lista = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Erro ao carregar posts";
      })

      // add
      .addCase(addPost.fulfilled, (state, action) => {
        state.lista.push(action.payload);
      })

      // ✅ delete
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        const removedId = String(action.payload);
        state.lista = state.lista.filter(p => String(p.id) !== removedId);
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Erro ao excluir post";
      });
  }
});

export default postsSlice.reducer;

{/*import api from "../api/axios";

// 🔹 Buscar todos os posts
export const fetchPosts = createAsyncThunk(
  "posts/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/posts");
      return res.data;
    } catch (err) {
      return rejectWithValue("Erro ao carregar posts");
    }
  }
);

// 🔹 Buscar posts de um usuário específico
export const fetchPostsByUser = createAsyncThunk(
  "posts/fetchByUser",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/posts?usuarioId=${userId}`);
      return { userId, posts: res.data };
    } catch (err) {
      return rejectWithValue("Erro ao carregar posts do usuário");
    }
  }
);

// 🔹 Criar novo post
export const createPost = createAsyncThunk(
  "posts/create",
  async (novoPost, { rejectWithValue }) => {
    try {
      const res = await api.post("/posts", novoPost);
      return res.data;
    } catch (err) {
      return rejectWithValue("Erro ao criar post");
    }
  }
);

// 🔹 Atualizar post (por exemplo, título ou conteúdo)
export const updatePost = createAsyncThunk(
  "posts/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/posts/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue("Erro ao atualizar post");
    }
  }
);

// 🔹 Excluir post
export const deletePost = createAsyncThunk(
  "posts/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/posts/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue("Erro ao excluir post");
    }
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState: {
    lista: [], // todos os posts
    byUser: {}, // { [userId]: [posts do usuário] }
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Buscar todos
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.lista = action.payload;
        state.loading = false;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Buscar por usuário
      .addCase(fetchPostsByUser.fulfilled, (state, action) => {
        const { userId, posts } = action.payload;
        state.byUser[userId] = posts;
      })
      // Criar
      .addCase(createPost.fulfilled, (state, action) => {
        state.lista.unshift(action.payload);
        const { usuarioId } = action.payload;
        if (!state.byUser[usuarioId]) state.byUser[usuarioId] = [];
        state.byUser[usuarioId].unshift(action.payload);
      })
      // Atualizar
      .addCase(updatePost.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.lista.findIndex((p) => p.id === updated.id);
        if (idx !== -1) state.lista[idx] = updated;
        const userPosts = state.byUser[updated.usuarioId];
        if (userPosts) {
          const i = userPosts.findIndex((p) => p.id === updated.id);
          if (i !== -1) userPosts[i] = updated;
        }
      })
      // Excluir
      .addCase(deletePost.fulfilled, (state, action) => {
        const id = action.payload;
        state.lista = state.lista.filter((p) => p.id !== id);
        for (const userId in state.byUser) {
          state.byUser[userId] = state.byUser[userId].filter((p) => p.id !== id);
        }
      });
  },
});

export default postsSlice.reducer;

// 🔹 Selectors
export const selectAllPosts = (state) => state.posts.lista || [];
export const selectPostsByUser = (userId) => (state) =>
  state.posts.byUser[userId] || [];
export const selectPostById = (id) => (state) =>
  state.posts.lista.find((p) => p.id === id);
*/}