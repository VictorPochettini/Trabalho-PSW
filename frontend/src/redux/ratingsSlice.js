// src/redux/ratingsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

function calcAvg(avaliacoes) {
  if (!avaliacoes || !avaliacoes.length) return { avg: 0, count: 0 };
  const sum = avaliacoes.reduce((a, r) => a + Number(r.estrelas || 0), 0);
  const count = avaliacoes.length;
  return { avg: Number((sum / count).toFixed(2)), count };
}

// Busca avaliação do usuário + média do post
export const fetchMyRatingForPost = createAsyncThunk(
  "ratings/fetchMyForPost",
  async ({ postId, usuarioId }, { rejectWithValue }) => {
    try {
      // Buscar avaliação específica do usuário
      const myRes = await api.get(`/avaliacoes/user/${usuarioId}/post/${postId}`);
      const myStars = myRes.data.exists ? Number(myRes.data.estrelas || 0) : 0;

      // Buscar estatísticas do post
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

// Buscar média do post (sem necessidade de usuário logado)
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

// 🔥 CORREÇÃO CRÍTICA: Backend pega usuarioId do token JWT (req.user._id)
// Então NÃO precisamos enviar usuarioId no body!
export const upsertRating = createAsyncThunk(
  "ratings/upsert",
  async ({ postId, usuarioId, estrelas }, { rejectWithValue }) => {
    try {
      // ✅ Backend usa req.user._id automaticamente do token
      // Enviamos apenas postId e estrelas
      const res = await api.post("/avaliacoes", {
        postId,
        estrelas: Number(estrelas)
        // ❌ NÃO enviar usuarioId - backend ignora e usa do token
      });

      console.log('✅ [ratingsSlice] Avaliação salva:', res.data);

      // Buscar estatísticas atualizadas do post
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
      console.error('❌ [ratingsSlice] Erro ao salvar avaliação:', err);
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || "Erro ao salvar avaliação");
    }
  }
);

// Remover avaliação
export const removeRating = createAsyncThunk(
  "ratings/remove",
  async ({ postId, usuarioId }, { rejectWithValue }) => {
    try {
      // Delete usando a rota específica
      await api.delete(`/avaliacoes/user/${usuarioId}/post/${postId}`);
      
      console.log('✅ [ratingsSlice] Avaliação removida');
      
      // Buscar estatísticas atualizadas
      const statsRes = await api.get(`/avaliacoes/stats/${postId}`);
      const postRating = {
        avg: Number(statsRes.data.average || 0),
        count: Number(statsRes.data.count || 0)
      };

      return { postId: String(postId), usuarioId: String(usuarioId), estrelas: 0, postRating };
    } catch (err) {
      console.error('❌ [ratingsSlice] Erro ao remover avaliação:', err);
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || "Erro ao remover avaliação");
    }
  }
);

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: {
    byPostId: {}, // postId -> { myStars, postAvg, postCount, saving, error }
  },
  reducers: {
    // Reducer para limpar erro
    clearRatingError: (state, action) => {
      const postId = String(action.payload);
      if (state.byPostId[postId]) {
        state.byPostId[postId].error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMyRatingForPost
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
      
      // fetchPostRating
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
      
      // upsertRating
      .addCase(upsertRating.pending, (s, a) => {
        const postId = String(a.meta.arg.postId);
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].saving = true;
        s.byPostId[postId].error = null;
      })
      .addCase(upsertRating.fulfilled, (s, a) => {
        const { postId, estrelas, postRating } = a.payload;
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
      
      // removeRating
      .addCase(removeRating.pending, (s, a) => {
        const postId = String(a.meta.arg.postId);
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].saving = true;
        s.byPostId[postId].error = null;
      })
      .addCase(removeRating.fulfilled, (s, a) => {
        const { postId, postRating } = a.payload;
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

// selector
export const selectRatingState = (postId) => (state) => 
  state.ratings.byPostId[String(postId)] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };