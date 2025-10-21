// src/redux/commentsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE = "http://localhost:5000"; // ajuste se necessário

export const fetchCommentsByPost = createAsyncThunk(
  "comments/fetchByPost",
  async (postId) => {
    const res = await fetch(
      `${BASE}/comentarios?postId=${postId}&_sort=createdAt&_order=asc`
    );
    if (!res.ok) throw new Error("Erro ao carregar comentários");
    return { postId: Number(postId), items: await res.json() };
  }
);

export const createComment = createAsyncThunk(
  "comments/create",
  async ({ postId, usuarioId, texto }) => {
    const now = new Date().toISOString();
    const body = {
      postId: Number(postId),
      usuarioId: Number(usuarioId),
      texto: texto.trim(),
      parentId: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      likes: 0,
    };
    const res = await fetch(`${BASE}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Erro ao criar comentário");
    return await res.json();
  }
);

// ✅ NOVO: remover comentário
export const deleteComment = createAsyncThunk(
  "comments/delete",
  async ({ id, postId }) => {
    const res = await fetch(`${BASE}/comentarios/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao excluir comentário");
    return { id: Number(id), postId: Number(postId) };
  }
);

const commentsSlice = createSlice({
  name: "comments",
  initialState: {
    byPostId: {}, // { [postId]: { items: [], loading: false, error: null } }
  },
  reducers: {
    clearCommentsOfPost(state, action) {
      const postId = Number(action.payload);
      delete state.byPostId[postId];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommentsByPost.pending, (state, action) => {
        const postId = Number(action.meta.arg);
        state.byPostId[postId] = state.byPostId[postId] || {
          items: [],
          loading: false,
          error: null,
        };
        state.byPostId[postId].loading = true;
        state.byPostId[postId].error = null;
      })
      .addCase(fetchCommentsByPost.fulfilled, (state, action) => {
        const { postId, items } = action.payload;
        state.byPostId[postId] = {
          items,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchCommentsByPost.rejected, (state, action) => {
        const postId = Number(action.meta.arg);
        state.byPostId[postId] = state.byPostId[postId] || {
          items: [],
          loading: false,
          error: null,
        };
        state.byPostId[postId].loading = false;
        state.byPostId[postId].error = action.error?.message || "Erro";
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const c = action.payload;
        const postId = Number(c.postId);
        state.byPostId[postId] = state.byPostId[postId] || {
          items: [],
          loading: false,
          error: null,
        };
        state.byPostId[postId].items.push(c);
      })
      // ✅ NOVO: remove do estado local quando apagar
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { postId, id } = action.payload;
        const bucket = state.byPostId[postId];
        if (bucket?.items) {
          const idx = bucket.items.findIndex(
            (c) => Number(c.id) === Number(id)
          );
          if (idx !== -1) bucket.items.splice(idx, 1);
        }
      });
  },
});

export const { clearCommentsOfPost } = commentsSlice.actions;
export default commentsSlice.reducer;

// Selectors
export const selectCommentsState = (postId) => (state) =>
  state.comments.byPostId[Number(postId)] || {
    items: [],
    loading: false,
    error: null,
  };
