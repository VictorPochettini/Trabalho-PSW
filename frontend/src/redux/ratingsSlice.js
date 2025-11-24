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
      // backend: GET /avaliacoes?postId=...&usuarioId=... (ou GET /avaliacoes/:id se usar id composto)
      const myRes = await api.get(`/avaliacoes?postId=${postId}&usuarioId=${usuarioId}`);
      const my = Array.isArray(myRes.data) ? myRes.data[0] : myRes.data;
      const myStars = my ? Number(my.estrelas || 0) : 0;

      const avsRes = await api.get(`/avaliacoes?postId=${postId}`);
      const postRating = calcAvg(avsRes.data);

      return { postId: String(postId), usuarioId: String(usuarioId), estrelas: myStars, postRating };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar avaliações");
    }
  }
);

// Buscar média do post
export const fetchPostRating = createAsyncThunk(
  "ratings/fetchPostRating",
  async (postId, { rejectWithValue }) => {
    try {
      const avsRes = await api.get(`/avaliacoes?postId=${postId}`);
      const postRating = calcAvg(avsRes.data);
      return { postId: String(postId), postRating };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar média");
    }
  }
);

// Upsert avaliação
export const upsertRating = createAsyncThunk(
  "ratings/upsert",
  async ({ postId, usuarioId, estrelas }, { rejectWithValue }) => {
    try {
      // backend prevents duplicate by checking usuarioId+postId; we POST and backend handles upsert or returns 409
      const res = await api.post("/avaliacoes", {
        postId,
        usuarioId,
        estrelas: Number(estrelas)
      });
      // depois recalc média:
      const avsRes = await api.get(`/avaliacoes?postId=${postId}`);
      const postRating = calcAvg(avsRes.data);
      // update post cached fields
      await api.patch(`/posts/${postId}`, { ratingAvg: postRating.avg, ratingCount: postRating.count });

      // update author ratingAvgRecebida
      const postRes = await api.get(`/posts/${postId}`);
      const post = postRes.data;
      const postsDoAutor = (await api.get(`/posts?usuarioId=${post.usuarioId}&_embed=avaliacoes`)).data;
      const allRatings = postsDoAutor.flatMap(p => p.avaliacoes || []);
      const authorRating = calcAvg(allRatings);
      await api.patch(`/usuarios/${post.usuarioId}`, { ratingAvgRecebida: authorRating.avg, ratingCountRecebida: authorRating.count });

      return { postId: String(postId), usuarioId: String(usuarioId), estrelas: Number(estrelas), postRating };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao salvar avaliação");
    }
  }
);

// Remover avaliação
export const removeRating = createAsyncThunk(
  "ratings/remove",
  async ({ postId, usuarioId }, { rejectWithValue }) => {
    try {
      // backend delete by id composed or by query — here try delete by id composed if backend uses it
      const id = `${postId}-${usuarioId}`;
      await api.delete(`/avaliacoes/${id}`);
      // recalc média do post
      const avsRes = await api.get(`/avaliacoes?postId=${postId}`);
      const postRating = calcAvg(avsRes.data);
      await api.patch(`/posts/${postId}`, { ratingAvg: postRating.avg, ratingCount: postRating.count });

      // recalc author
      const post = (await api.get(`/posts/${postId}`)).data;
      const postsDoAutor = (await api.get(`/posts?usuarioId=${post.usuarioId}&_embed=avaliacoes`)).data;
      const allRatings = postsDoAutor.flatMap(p => p.avaliacoes || []);
      const authorRating = calcAvg(allRatings);
      await api.patch(`/usuarios/${post.usuarioId}`, { ratingAvgRecebida: authorRating.avg, ratingCountRecebida: authorRating.count });

      return { postId: String(postId), usuarioId: String(usuarioId), estrelas: 0, postRating };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao remover avaliação");
    }
  }
);

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: {
    byPostId: {}, // postId -> { myStars, postAvg, postCount, saving, error }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyRatingForPost.fulfilled, (s, a) => {
        const { postId, estrelas, postRating } = a.payload;
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].myStars = Number(estrelas || 0);
        s.byPostId[postId].postAvg = postRating.avg;
        s.byPostId[postId].postCount = postRating.count;
      })
      .addCase(fetchPostRating.fulfilled, (s, a) => {
        const { postId, postRating } = a.payload;
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].postAvg = postRating.avg;
        s.byPostId[postId].postCount = postRating.count;
      })
      .addCase(upsertRating.pending, (s, a) => {
        const postId = a.meta.arg.postId;
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].saving = true;
        s.byPostId[postId].error = null;
      })
      .addCase(upsertRating.fulfilled, (s, a) => {
        const { postId, estrelas, postRating } = a.payload;
        s.byPostId[postId] = { myStars: estrelas, saving: false, error: null, postAvg: postRating.avg, postCount: postRating.count };
      })
      .addCase(upsertRating.rejected, (s, a) => {
        const postId = a.meta.arg.postId;
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].saving = false;
        s.byPostId[postId].error = a.payload || a.error?.message;
      })
      .addCase(removeRating.pending, (s, a) => {
        const postId = a.meta.arg.postId;
        s.byPostId[postId] = s.byPostId[postId] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
        s.byPostId[postId].saving = true;
        s.byPostId[postId].error = null;
      })
      .addCase(removeRating.fulfilled, (s, a) => {
        const { postId, estrelas, postRating } = a.payload;
        s.byPostId[postId] = { myStars: estrelas, saving: false, error: null, postAvg: postRating.avg, postCount: postRating.count };
      })
      .addCase(removeRating.rejected, (s, a) => {
        const postId = a.meta.arg.postId;
        s.byPostId[postId].saving = false;
        s.byPostId[postId].error = a.payload || a.error?.message;
      });
  },
});

export default ratingsSlice.reducer;

// selector
export const selectRatingState = (postId) => (state) => state.ratings.byPostId[String(postId)] || { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 };
