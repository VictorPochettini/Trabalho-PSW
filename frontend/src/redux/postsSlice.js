// src/redux/postsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

const API_URL = "/posts";

// Thunks
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

export const fetchPostsByUser = createAsyncThunk(
  "posts/fetchByUser",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}?usuarioId=${userId}`);
      return { userId, posts: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar posts do usuário");
    }
  }
);

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

export const deletePost = createAsyncThunk(
  "posts/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao excluir post");
    }
  }
);

// Slice
const postsSlice = createSlice({
  name: "posts",
  initialState: {
    lista: [],
    byUser: {},
    loading: false,
    error: null,
  },
  reducers: {
    // ação síncrona exportada para uso local/otimista
    // payload: post object
    addPost(state, action) {
      // insere no topo
      const post = action.payload;
      state.lista.unshift(post);
      const uid = post.usuarioId || post.author || post.userId;
      if (uid) {
        state.byUser[uid] = state.byUser[uid] || [];
        state.byUser[uid].unshift(post);
      }
    },

    // ação para sobrescrever lista (útil em formulários locais)
    setPosts(state, action) {
      state.lista = action.payload || [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.lista = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      .addCase(fetchPostsByUser.fulfilled, (state, action) => {
        const { userId, posts } = action.payload;
        state.byUser[userId] = posts;
      })

      .addCase(createPost.fulfilled, (state, action) => {
        // o backend retornou o post criado — garante consistência
        const created = action.payload;
        // evita duplicata se já tiver sido adicionada otimisticamente
        const exists = state.lista.findIndex(p => String(p._id || p.id) === String(created._id || created.id));
        if (exists === -1) {
          state.lista.unshift(created);
        } else {
          state.lista[exists] = created;
        }
        const uid = created.usuarioId || created.author || created.userId;
        if (uid) {
          state.byUser[uid] = state.byUser[uid] || [];
          const idx = state.byUser[uid].findIndex(p => String(p._id || p.id) === String(created._id || created.id));
          if (idx === -1) state.byUser[uid].unshift(created); else state.byUser[uid][idx] = created;
        }
      })

      .addCase(updatePost.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.lista.findIndex((p) => String(p._id || p.id) === String(updated._id || updated.id));
        if (idx !== -1) state.lista[idx] = updated;
        const uid = updated.usuarioId || updated.author || updated.userId;
        if (uid && state.byUser[uid]) {
          const i = state.byUser[uid].findIndex(p => String(p._id || p.id) === String(updated._id || updated.id));
          if (i !== -1) state.byUser[uid][i] = updated;
        }
      })

      .addCase(deletePost.fulfilled, (state, action) => {
        const id = action.payload;
        state.lista = state.lista.filter((p) => String(p._id || p.id) !== String(id));
        for (const k in state.byUser) {
          state.byUser[k] = state.byUser[k].filter((p) => String(p._id || p.id) !== String(id));
        }
      });
  },
});

export const { addPost, setPosts } = postsSlice.actions;
export default postsSlice.reducer;

// Selectors
export const selectAllPosts = (state) => state.posts.lista || [];
export const selectPostsByUser = (userId) => (state) => state.posts.byUser[userId] || [];
export const selectPostById = (id) => (state) => state.posts.lista.find((p) => String(p._id || p.id) === String(id));
