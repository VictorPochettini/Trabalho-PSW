// src/redux/ratingsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE = "http://localhost:5000"; // ajuste se necessário

function calcAvg(arr) {
  if (!arr.length) return { avg: 0, count: 0 };
  const sum = arr.reduce((a, r) => a + Number(r.estrelas || 0), 0);
  const count = arr.length;
  return { avg: Number((sum / count).toFixed(2)), count };
}

export const fetchMyRatingForPost = createAsyncThunk(
  "ratings/fetchMyForPost",
  async ({ postId, usuarioId }) => {
    const id = `${Number(postId)}-${Number(usuarioId)}`;
    const res = await fetch(`${BASE}/avaliacoes/${id}`);
    if (res.status === 404) {
      return { postId: Number(postId), usuarioId: Number(usuarioId), estrelas: 0 };
    }
    if (!res.ok) throw new Error("Erro ao carregar avaliação");
    const data = await res.json();
    return { postId: Number(postId), usuarioId: Number(usuarioId), estrelas: data.estrelas };
  }
);

// Upsert + atualiza caches do post e do autor do post
// Substitua seu upsertRating por este:

export const upsertRating = createAsyncThunk(
  "ratings/upsert",
  async ({ postId, usuarioId, estrelas }) => {
    const BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";
    const pid = Number(postId);
    const uid = Number(usuarioId);
    const id = `${pid}-${uid}`;
    const now = new Date().toISOString();

    // 1) Verifica se já existe
    const getRes = await fetch(`${BASE}/avaliacoes/${id}`);
    let existed = getRes.ok;

    // 2) Cria ou atualiza
    if (!existed) {
      // POST cria (com id composto no body)
      const createRes = await fetch(`${BASE}/avaliacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          postId: pid,
          usuarioId: uid,
          estrelas: Number(estrelas),
          createdAt: now,
          updatedAt: now,
        }),
      });
      if (!createRes.ok) {
        const t = await createRes.text().catch(() => "");
        throw new Error(`Erro ao criar avaliação (${createRes.status}) ${t}`);
      }
    } else {
      // PATCH atualiza somente campos necessários
      const patchRes = await fetch(`${BASE}/avaliacoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estrelas: Number(estrelas),
          updatedAt: now,
        }),
      });
      if (!patchRes.ok) {
        const t = await patchRes.text().catch(() => "");
        throw new Error(`Erro ao atualizar avaliação (${patchRes.status}) ${t}`);
      }
    }

    // 3) Recalcula média do post e cacheia
    const avsRes = await fetch(`${BASE}/avaliacoes?postId=${pid}`);
    if (!avsRes.ok) throw new Error("Erro ao obter avaliações do post");
    const avs = await avsRes.json();
    const sum = avs.reduce((a, r) => a + Number(r.estrelas || 0), 0);
    const count = avs.length;
    const avg = count ? Number((sum / count).toFixed(2)) : 0;

    const patchPost = await fetch(`${BASE}/posts/${pid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratingAvg: avg, ratingCount: count }),
    });
    if (!patchPost.ok) throw new Error("Erro ao atualizar média do post");

    // 4) Recalcula média recebida do autor e cacheia no usuário
    const postRes = await fetch(`${BASE}/posts/${pid}`);
    const post = await postRes.json();

    const postsDoAutorRes = await fetch(
      `${BASE}/posts?usuarioId=${post.usuarioId}&_embed=avaliacoes`
    );
    const postsDoAutor = await postsDoAutorRes.json();
    const allRatings = postsDoAutor.flatMap((p) => p.avaliacoes || []);
    const sum2 = allRatings.reduce((a, r) => a + Number(r.estrelas || 0), 0);
    const count2 = allRatings.length;
    const avg2 = count2 ? Number((sum2 / count2).toFixed(2)) : 0;

    await fetch(`${BASE}/usuarios/${post.usuarioId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ratingAvgRecebida: avg2,
        ratingCountRecebida: count2,
      }),
    });

    return {
      postId: pid,
      usuarioId: uid,
      estrelas: Number(estrelas),
      postRating: { avg, count },
    };
  }
);


const ratingsSlice = createSlice({
  name: "ratings",
  initialState: {
    byPostId: {
      // [postId]: { myStars: 0, saving: false, error: null, postAvg: 0, postCount: 0 }
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyRatingForPost.fulfilled, (state, action) => {
        const { postId, estrelas } = action.payload;
        state.byPostId[postId] = state.byPostId[postId] || {
          myStars: 0,
          saving: false,
          error: null,
          postAvg: 0,
          postCount: 0,
        };
        state.byPostId[postId].myStars = Number(estrelas || 0);
      })
      .addCase(upsertRating.pending, (state, action) => {
        const { postId } = action.meta.arg;
        state.byPostId[postId] = state.byPostId[postId] || {
          myStars: 0,
          saving: false,
          error: null,
          postAvg: 0,
          postCount: 0,
        };
        state.byPostId[postId].saving = true;
        state.byPostId[postId].error = null;
      })
      .addCase(upsertRating.fulfilled, (state, action) => {
        const { postId, estrelas, postRating } = action.payload;
        state.byPostId[postId] = state.byPostId[postId] || {
          myStars: 0,
          saving: false,
          error: null,
          postAvg: 0,
          postCount: 0,
        };
        state.byPostId[postId].saving = false;
        state.byPostId[postId].myStars = Number(estrelas);
        if (postRating) {
          state.byPostId[postId].postAvg = postRating.avg;
          state.byPostId[postId].postCount = postRating.count;
        }
      })
      .addCase(upsertRating.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.byPostId[postId] = state.byPostId[postId] || {
          myStars: 0,
          saving: false,
          error: null,
          postAvg: 0,
          postCount: 0,
        };
        state.byPostId[postId].saving = false;
        state.byPostId[postId].error = action.error?.message || "Erro";
      });
  },
});

export default ratingsSlice.reducer;

// Selectors
export const selectRatingState = (postId) => (state) =>
  state.ratings.byPostId[Number(postId)] || {
    myStars: 0,
    saving: false,
    error: null,
    postAvg: 0,
    postCount: 0,
  };
