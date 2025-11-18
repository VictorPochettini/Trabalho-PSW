// src/redux/ratingsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE = "http://localhost:5000";

// Função auxiliar para calcular média
function calcAvg(avaliacoes) {
  if (!avaliacoes || !avaliacoes.length) return { avg: 0, count: 0 };
  const sum = avaliacoes.reduce((a, r) => a + Number(r.estrelas || 0), 0);
  const count = avaliacoes.length;
  return { avg: Number((sum / count).toFixed(2)), count };
}

// Buscar avaliação do usuário atual + média do post
export const fetchMyRatingForPost = createAsyncThunk(
  "ratings/fetchMyForPost",
  async ({ postId, usuarioId }) => {
    const id = `${Number(postId)}-${Number(usuarioId)}`;
    
    // Buscar avaliação do usuário
    let myStars = 0;
    try {
      const res = await fetch(`${BASE}/avaliacoes/${id}`);
      if (res.ok) {
        const data = await res.json();
        myStars = data.estrelas || 0;
      }
    } catch (error) {
      console.error("Erro ao buscar avaliação do usuário:", error);
    }

    // Buscar todas as avaliações do post para calcular média
    let postRating = { avg: 0, count: 0 };
    try {
      const avsRes = await fetch(`${BASE}/avaliacoes?postId=${postId}`);
      if (avsRes.ok) {
        const avs = await avsRes.json();
        postRating = calcAvg(avs);
      }
    } catch (error) {
      console.error("Erro ao buscar avaliações do post:", error);
    }

    return { 
      postId: Number(postId), 
      usuarioId: Number(usuarioId), 
      estrelas: myStars,
      postRating 
    };
  }
);

// Buscar apenas a média do post (para quando não há usuário logado)
export const fetchPostRating = createAsyncThunk(
  "ratings/fetchPostRating",
  async (postId) => {
    let postRating = { avg: 0, count: 0 };
    try {
      const avsRes = await fetch(`${BASE}/avaliacoes?postId=${postId}`);
      if (avsRes.ok) {
        const avs = await avsRes.json();
        postRating = calcAvg(avs);
      }
    } catch (error) {
      console.error("Erro ao buscar avaliações do post:", error);
    }

    return { 
      postId: Number(postId),
      postRating 
    };
  }
);

// Remove avaliação + atualiza caches
export const removeRating = createAsyncThunk(
  "ratings/remove",
  async ({ postId, usuarioId }) => {
    const BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";
    const pid = Number(postId);
    const uid = Number(usuarioId);
    const id = `${pid}-${uid}`;

    // 1) Remove a avaliação
    const deleteRes = await fetch(`${BASE}/avaliacoes/${id}`, {
      method: "DELETE",
    });
    
    if (!deleteRes.ok && deleteRes.status !== 404) {
      const t = await deleteRes.text().catch(() => "");
      throw new Error(`Erro ao remover avaliação (${deleteRes.status}) ${t}`);
    }

    // 2) Recalcula média do post e cacheia
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

    // 3) Recalcula média recebida do autor e cacheia no usuário
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
      estrelas: 0,
      postRating: { avg, count },
    };
  }
);

// Upsert + atualiza caches do post e do autor do post
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
        const { postId, estrelas, postRating } = action.payload;
        state.byPostId[postId] = state.byPostId[postId] || {
          myStars: 0,
          saving: false,
          error: null,
          postAvg: 0,
          postCount: 0,
        };
        state.byPostId[postId].myStars = Number(estrelas || 0);
        if (postRating) {
          state.byPostId[postId].postAvg = postRating.avg;
          state.byPostId[postId].postCount = postRating.count;
        }
      })
      .addCase(fetchPostRating.fulfilled, (state, action) => {
        const { postId, postRating } = action.payload;
        state.byPostId[postId] = state.byPostId[postId] || {
          myStars: 0,
          saving: false,
          error: null,
          postAvg: 0,
          postCount: 0,
        };
        if (postRating) {
          state.byPostId[postId].postAvg = postRating.avg;
          state.byPostId[postId].postCount = postRating.count;
        }
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
      })
      .addCase(removeRating.pending, (state, action) => {
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
      .addCase(removeRating.fulfilled, (state, action) => {
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
      .addCase(removeRating.rejected, (state, action) => {
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

{/*import api from "../api/axios";

// 🔹 Buscar avaliação do usuário + média do post
export const fetchMyRatingForPost = createAsyncThunk(
  "ratings/fetchMyForPost",
  async ({ postId, usuarioId }, { rejectWithValue }) => {
    try {
      const [myRes, avgRes] = await Promise.all([
        api.get(`/ratings/user/${usuarioId}/post/${postId}`),
        api.get(`/ratings/post/${postId}`)
      ]);

      return {
        postId,
        usuarioId,
        estrelas: myRes.data?.estrelas || 0,
        postRating: avgRes.data || { avg: 0, count: 0 }
      };
    } catch (err) {
      return rejectWithValue("Erro ao buscar avaliação");
    }
  }
);

// 🔹 Buscar média geral do post
export const fetchPostRating = createAsyncThunk(
  "ratings/fetchPostRating",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/ratings/post/${postId}`);
      return { postId, postRating: res.data || { avg: 0, count: 0 } };
    } catch (err) {
      return rejectWithValue("Erro ao buscar média do post");
    }
  }
);

// 🔹 Criar ou atualizar avaliação
export const upsertRating = createAsyncThunk(
  "ratings/upsert",
  async ({ postId, usuarioId, estrelas }, { rejectWithValue }) => {
    try {
      const res = await api.post("/ratings", { postId, usuarioId, estrelas });
      return {
        postId,
        usuarioId,
        estrelas,
        postRating: res.data?.postRating || { avg: 0, count: 0 }
      };
    } catch (err) {
      return rejectWithValue("Erro ao registrar avaliação");
    }
  }
);

// 🔹 Remover avaliação
export const removeRating = createAsyncThunk(
  "ratings/remove",
  async ({ postId, usuarioId }, { rejectWithValue }) => {
    try {
      await api.delete(`/ratings/${postId}-${usuarioId}`);
      const res = await api.get(`/ratings/post/${postId}`);
      return {
        postId,
        usuarioId,
        estrelas: 0,
        postRating: res.data || { avg: 0, count: 0 }
      };
    } catch (err) {
      return rejectWithValue("Erro ao remover avaliação");
    }
  }
);

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: {
    byPostId: {}, // [postId]: { myStars, postAvg, postCount, saving, error }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Buscar média + avaliação do usuário
      .addCase(fetchMyRatingForPost.fulfilled, (state, action) => {
        const { postId, estrelas, postRating } = action.payload;
        state.byPostId[postId] = {
          myStars: estrelas || 0,
          postAvg: postRating.avg || 0,
          postCount: postRating.count || 0,
          saving: false,
          error: null
        };
      })
      // Buscar média apenas
      .addCase(fetchPostRating.fulfilled, (state, action) => {
        const { postId, postRating } = action.payload;
        state.byPostId[postId] = {
          ...(state.byPostId[postId] || {}),
          postAvg: postRating.avg || 0,
          postCount: postRating.count || 0
        };
      })
      // Upsert
      .addCase(upsertRating.pending, (state, action) => {
        const { postId } = action.meta.arg;
        if (!state.byPostId[postId])
          state.byPostId[postId] = { myStars: 0, postAvg: 0, postCount: 0 };
        state.byPostId[postId].saving = true;
      })
      .addCase(upsertRating.fulfilled, (state, action) => {
        const { postId, estrelas, postRating } = action.payload;
        state.byPostId[postId] = {
          myStars: estrelas,
          postAvg: postRating.avg || 0,
          postCount: postRating.count || 0,
          saving: false,
          error: null
        };
      })
      .addCase(upsertRating.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.byPostId[postId].saving = false;
        state.byPostId[postId].error = action.payload;
      })
      // Remover avaliação
      .addCase(removeRating.fulfilled, (state, action) => {
        const { postId, postRating } = action.payload;
        state.byPostId[postId] = {
          myStars: 0,
          postAvg: postRating.avg || 0,
          postCount: postRating.count || 0,
          saving: false,
          error: null
        };
      })
      .addCase(removeRating.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.byPostId[postId].saving = false;
        state.byPostId[postId].error = action.payload;
      });
  },
});

export default ratingsSlice.reducer;

// 🔹 Selectors
export const selectRatingState = (postId) => (state) =>
  state.ratings.byPostId[postId] || {
    myStars: 0,
    saving: false,
    error: null,
    postAvg: 0,
    postCount: 0
  };
*/}