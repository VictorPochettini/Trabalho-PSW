// src/redux/commentsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const fetchCommentsByPost = createAsyncThunk(
  "comments/fetchByPost",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/comentarios?postId=${postId}&_sort=createdAt&_order=asc`);
      return { postId: String(postId), items: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar comentários");
    }
  }
);

export const createComment = createAsyncThunk(
  "comments/create",
  async ({ postId, texto }, { getState, rejectWithValue }) => {
    try {
      const current = getState().user.currentUser;
      const usuarioId = current?.user?._id || current?.user?.id;
      if (!usuarioId) return rejectWithValue("Usuário não autenticado");

      const now = new Date().toISOString();
      const body = {
        postId: String(postId),
        usuarioId,
        texto: texto.trim(),
        createdAt: now,
        updatedAt: now,
      };
      const res = await api.post("/comentarios", body);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao criar comentário");
    }
  }
);

export const deleteComment = createAsyncThunk(
  "comments/delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      await api.delete(`/comentarios/${id}`);
      return { id };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao excluir comentário");
    }
  }
);

const commentsSlice = createSlice({
  name: "comments",
  initialState: {
    byPostId: {}, // postId -> { items, loading, error }
  },
  reducers: {
    clearCommentsOfPost(state, action) {
      const postId = String(action.payload);
      delete state.byPostId[postId];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommentsByPost.pending, (state, action) => {
        const postId = String(action.meta.arg);
        state.byPostId[postId] = state.byPostId[postId] || { items: [], loading: false, error: null };
        state.byPostId[postId].loading = true;
        state.byPostId[postId].error = null;
      })
      .addCase(fetchCommentsByPost.fulfilled, (state, action) => {
        const { postId, items } = action.payload;
        state.byPostId[postId] = { items, loading: false, error: null };
      })
      .addCase(fetchCommentsByPost.rejected, (state, action) => {
        const postId = String(action.meta.arg);
        state.byPostId[postId] = state.byPostId[postId] || { items: [], loading: false, error: null };
        state.byPostId[postId].loading = false;
        state.byPostId[postId].error = action.payload || action.error?.message;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const c = action.payload;
        const postId = String(c.postId);
        state.byPostId[postId] = state.byPostId[postId] || { items: [], loading: false, error: null };
        state.byPostId[postId].items.push(c);
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { id } = action.payload;
        for (const pid of Object.keys(state.byPostId)) {
          const bucket = state.byPostId[pid];
          if (!bucket?.items) continue;
          const idx = bucket.items.findIndex((c) => String(c._id || c.id) === String(id));
          if (idx !== -1) bucket.items.splice(idx, 1);
        }
      })
      .addMatcher((action) => action.type.endsWith("/rejected") && action.type.includes("comments"), (s, a) => {
        // global comment error set (optional)
      });
  },
});

export const { clearCommentsOfPost } = commentsSlice.actions;
export default commentsSlice.reducer;

// selectors
export const selectCommentsState = (postId) => (state) =>
  state.comments.byPostId[String(postId)] || { items: [], loading: false, error: null };
