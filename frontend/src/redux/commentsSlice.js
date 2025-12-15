// src/redux/commentsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// --- AÇÕES ASSÍNCRONAS (THUNKS) ---

/**
 * Busca comentários de um post específico, ordenando por criação (mais recente primeiro).
 */
export const fetchCommentsByPost = createAsyncThunk(
  "comments/fetchByPost",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/comentarios?postId=${postId}&_sort=createdAt&_order=desc`);
      return { postId: String(postId), items: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar comentários");
    }
  }
);

/**
 * Cria um novo comentário. Requer que o usuário esteja autenticado.
 */
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

/**
 * Atualiza o texto de um comentário existente.
 */
export const updateComment = createAsyncThunk(
  "comments/update",
  async ({ commentId, texto }, { rejectWithValue }) => {
    try {
      const body = {
        texto: texto.trim(),
        updatedAt: new Date().toISOString(),
      };
      const res = await api.patch(`/comentarios/${commentId}`, body);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao atualizar comentário");
    }
  }
);

/**
 * Exclui um comentário pelo seu ID.
 */
export const deleteComment = createAsyncThunk(
  "comments/delete",
  async (commentId, { rejectWithValue }) => {
    try {
      await api.delete(`/comentarios/${commentId}`);
      return { id: commentId }; // Retorna o ID para o reducer remover do estado
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao excluir comentário");
    }
  }
);

// --- SLICE E REDUCERS ---

const commentsSlice = createSlice({
  name: "comments",
  initialState: {
    byPostId: {}, // Estrutura: postId -> { items, loading, error }
  },
  reducers: {
    /**
     * Limpa o cache de comentários para um post específico.
     * @param {string} postId
     */
    clearCommentsOfPost(state, action) {
      const postId = String(action.payload);
      delete state.byPostId[postId];
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH PENDING
      .addCase(fetchCommentsByPost.pending, (state, action) => {
        const postId = String(action.meta.arg);
        state.byPostId[postId] = state.byPostId[postId] || { items: [], loading: false, error: null };
        state.byPostId[postId].loading = true;
        state.byPostId[postId].error = null;
      })
      // FETCH FULFILLED
      .addCase(fetchCommentsByPost.fulfilled, (state, action) => {
        const { postId, items } = action.payload;
        state.byPostId[postId] = { items, loading: false, error: null };
      })
      // FETCH REJECTED
      .addCase(fetchCommentsByPost.rejected, (state, action) => {
        const postId = String(action.meta.arg);
        state.byPostId[postId] = state.byPostId[postId] || { items: [], loading: false, error: null };
        state.byPostId[postId].loading = false;
        state.byPostId[postId].error = action.payload || action.error?.message;
      })
      // CREATE FULFILLED
      .addCase(createComment.fulfilled, (state, action) => {
        const c = action.payload;
        const postId = String(c.postId);
        state.byPostId[postId] = state.byPostId[postId] || { items: [], loading: false, error: null };
        // Adiciona no início (mais recente primeiro)
        state.byPostId[postId].items.unshift(c);
      })
      // UPDATE FULFILLED
      .addCase(updateComment.fulfilled, (state, action) => {
        const updatedComment = action.payload;
        const postId = String(updatedComment.postId);
        
        if (state.byPostId[postId]) {
          const idx = state.byPostId[postId].items.findIndex(
            (c) => String(c._id || c.id) === String(updatedComment._id || updatedComment.id)
          );
          if (idx !== -1) {
            // Substitui o comentário atualizado mantendo a posição
            state.byPostId[postId].items[idx] = updatedComment;
          }
        }
      })
      // DELETE FULFILLED
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { id } = action.payload;
        // Percorre todos os posts para remover o comentário excluído de qualquer bucket
        for (const pid of Object.keys(state.byPostId)) {
          const bucket = state.byPostId[pid];
          if (!bucket?.items) continue;
          const idx = bucket.items.findIndex((c) => String(c._id || c.id) === String(id));
          if (idx !== -1) bucket.items.splice(idx, 1);
        }
      })
      // Matcher para lidar com erros globais (opcional)
      .addMatcher((action) => action.type.endsWith("/rejected") && action.type.includes("comments"), (s, a) => {
        // Lógica de tratamento de erro global
      });
  },
});

export const { clearCommentsOfPost } = commentsSlice.actions;
export default commentsSlice.reducer;

// --- SELECTOR ---

/**
 * Seletor que retorna o estado completo dos comentários para um postId específico.
 */
export const selectCommentsState = (postId) => (state) =>
  state.comments.byPostId[String(postId)] || { items: [], loading: false, error: null };