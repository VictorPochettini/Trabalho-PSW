// src/redux/ratingsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// Função utilitária (não usada nos thunks finais, mas mantida por referência)
function calcAvg(avaliacoes) {
  if (!avaliacoes || !avaliacoes.length) return { avg: 0, count: 0 };
  const sum = avaliacoes.reduce((a, r) => a + Number(r.estrelas || 0), 0);
  const count = avaliacoes.length;
  return { avg: Number((sum / count).toFixed(2)), count };
}

// --- AÇÕES ASSÍNCRONAS (THUNKS) ---

/**
 * Busca a avaliação do usuário logado para um post E as estatísticas (média/contagem) do post.
 */
export const fetchMyRatingForPost = createAsyncThunk(
  "ratings/fetchMyForPost",
  async ({ postId, usuarioId }, { rejectWithValue }) => {
    try {
      // 1. Buscar avaliação específica do usuário
      const myRes = await api.get(`/avaliacoes/user/${usuarioId}/post/${postId}`);
      const myStars = myRes.data.exists ? Number(myRes.data.estrelas || 0) : 0;

      // 2. Buscar estatísticas do post
      const statsRes = await api.get(`/avaliacoes/stats/${postId}`);
      const postRating = {
        avg: Number(statsRes.data.average || 0),
        count: Number(statsRes.data.count || 0)
      };

      return { postId: String(postId), usuarioId: String(usuarioId), estrelas: myStars, postRating };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar avaliações");
    }
  }
);

/**
 * Buscar apenas a média e contagem de avaliações de um post.
 */
export const fetchPostRating = createAsyncThunk(
  "ratings/fetchPostRating",
  async (postId, { rejectWithValue }) => {
    try {
      const statsRes = await api.get(`/avaliacoes/stats/${postId}`);
      const postRating = {
        avg: Number(statsRes.data.average || 0),
        count: Number(statsRes.data.count || 0)
      };
      return { postId: String(postId), postRating };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar média");
    }
  }
);

/**
 * Cria ou atualiza a avaliação de um post (upsert).
 * Requisita usuarioId no payload para consistência do estado, mas o backend usa o token.
 */
export const upsertRating = createAsyncThunk(
  "ratings/upsert",
  async ({ postId, usuarioId, estrelas }, { rejectWithValue }) => {
    try {
      // O backend usará req.user._id do token.
      await api.post("/avaliacoes", { postId, estrelas: Number(estrelas) });

      // Buscar estatísticas atualizadas do post após a ação (fonte de verdade)
      const statsRes = await api.get(`/avaliacoes/stats/${postId}`);
      const postRating = {
        avg: Number(statsRes.data.average || 0),
        count: Number(statsRes.data.count || 0)
      };

      return { 
        postId: String(postId), 
        usuarioId: String(usuarioId), 
        estrelas: Number(estrelas), 
        postRating 
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || "Erro ao salvar avaliação");
    }
  }
);

/**
 * Remove a avaliação do usuário logado para um post.
 */
export const removeRating = createAsyncThunk(
  "ratings/remove",
  async ({ postId, usuarioId }, { rejectWithValue }) => {
    try {
      // Rota de DELETE específica para remover a avaliação do usuário
      await api.delete(`/avaliacoes/user/${usuarioId}/post/${postId}`);
      
      // Buscar estatísticas atualizadas
      const statsRes = await api.get(`/avaliacoes/stats/${postId}`);
      const postRating = {
        avg: Number(statsRes.data.average || 0),
        count: Number(statsRes.data.count || 0)
      };

      return { postId: String(postId), usuarioId: String(usuarioId), estrelas: 0, postRating };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || "Erro ao remover avaliação");
    }
  }
);

// --- SLICE E REDUCERS ---

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: {
    // Cache de estado por Post ID
    // postId -> { myStars: number, postAvg: number, postCount: number, saving: boolean, error: string|null }
    byPostId: {}, 
  },
  reducers: {
    /**
     * Limpa o erro para um post específico.
     */
    clearRatingError: (state, action) => {
      const postId = String(action.payload);
      if (state.byPostId[postId]) {
        state.byPostId[postId].error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetchMyRatingForPost ---
      .addCase(fetchMyRatingForPost.pending, (s, a) => {
        const postId = String(a.meta.arg.postId);
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
      })
      .addCase(fetchMyRatingForPost.fulfilled, (s, a) => {
        const { postId, estrelas, postRating } = a.payload;
        s.byPostId[postId] = {
          myStars: Number(estrelas || 0),
          postAvg: postRating.avg,
          postCount: postRating.count,
          saving: false,
          error: null
        };
      })
      .addCase(fetchMyRatingForPost.rejected, (s, a) => {
        const postId = String(a.meta.arg.postId);
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].error = a.payload || a.error?.message;
      })
      
      // --- fetchPostRating (Apenas estatísticas) ---
      .addCase(fetchPostRating.pending, (s, a) => {
        const postId = String(a.meta.arg);
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
      })
      .addCase(fetchPostRating.fulfilled, (s, a) => {
        const { postId, postRating } = a.payload;
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].postAvg = postRating.avg;
        s.byPostId[postId].postCount = postRating.count;
      })
      .addCase(fetchPostRating.rejected, (s, a) => {
        const postId = String(a.meta.arg);
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].error = a.payload || a.error?.message;
      })
      
      // --- upsertRating ---
      .addCase(upsertRating.pending, (s, a) => {
        const postId = String(a.meta.arg.postId);
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].saving = true; // Indica que a ação está em andamento
        s.byPostId[postId].error = null;
      })
      .addCase(upsertRating.fulfilled, (s, a) => {
        const { postId, estrelas, postRating } = a.payload;
        // Atualiza a avaliação do usuário e as estatísticas do post com dados frescos do backend
        s.byPostId[postId] = { 
          myStars: Number(estrelas), 
          saving: false, 
          error: null, 
          postAvg: postRating.avg, 
          postCount: postRating.count 
        };
      })
      .addCase(upsertRating.rejected, (s, a) => {
        const postId = String(a.meta.arg.postId);
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].saving = false;
        s.byPostId[postId].error = a.payload || a.error?.message;
      })
      
      // --- removeRating ---
      .addCase(removeRating.pending, (s, a) => {
        const postId = String(a.meta.arg.postId);
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].saving = true;
        s.byPostId[postId].error = null;
      })
      .addCase(removeRating.fulfilled, (s, a) => {
        const { postId, postRating } = a.payload;
        // Zera a avaliação do usuário e atualiza as estatísticas
        s.byPostId[postId] = { 
          myStars: 0, 
          saving: false, 
          error: null, 
          postAvg: postRating.avg, 
          postCount: postRating.count 
        };
      })
      .addCase(removeRating.rejected, (s, a) => {
        const postId = String(a.meta.arg.postId);
        if (s.byPostId[postId]) {
          s.byPostId[postId].saving = false;
          s.byPostId[postId].error = a.payload || a.error?.message;
        }
      });
  },
});

export const { clearRatingError } = ratingsSlice.actions;
export default ratingsSlice.reducer;

// --- SELECTOR ---

/**
 * Seletor de fábrica que retorna todo o objeto de estado de avaliação de um post.
 * @param {string} postId
 */
export const selectRatingState = (postId) => (state) => 
  state.ratings.byPostId[String(postId)] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };