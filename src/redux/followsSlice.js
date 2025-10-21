import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
const BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

function key(followerId, followingId) {
  return `${Number(followerId)}-${Number(followingId)}`;
}

// Verifica se currentUser segue o userId (para pintar o botão)
export const fetchIsFollowing = createAsyncThunk(
  "follows/fetchIsFollowing",
  async ({ followerId, followingId }) => {
    const id = key(followerId, followingId);
    const res = await fetch(`${BASE}/seguidores/${id}`);
    if (res.status === 404) return { followerId, followingId, isFollowing: false };
    if (!res.ok) throw new Error("Erro ao consultar relação de follow");
    return { followerId, followingId, isFollowing: true };
  }
);

// Lista contagens (para caches e telas de perfil)
export const fetchFollowCounts = createAsyncThunk(
  "follows/fetchCounts",
  async ({ userId }) => {
    const [followersRes, followingRes] = await Promise.all([
      fetch(`${BASE}/seguidores?followingId=${Number(userId)}`),
      fetch(`${BASE}/seguidores?followerId=${Number(userId)}`),
    ]);
    if (!followersRes.ok || !followingRes.ok) throw new Error("Erro ao carregar contagens");
    const followers = await followersRes.json();
    const following = await followingRes.json();
    return { userId: Number(userId), followersCount: followers.length, followingCount: following.length };
  }
);

// Seguir (idempotente: cria se não existir)
export const followUser = createAsyncThunk(
  "follows/followUser",
  async ({ followerId, followingId }) => {
    const id = key(followerId, followingId);
    // já existe?
    const getR = await fetch(`${BASE}/seguidores/${id}`);
    if (getR.ok) return { followerId, followingId, created: false };

    const now = new Date().toISOString();
    const createR = await fetch(`${BASE}/seguidores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, followerId: Number(followerId), followingId: Number(followingId), createdAt: now }),
    });
    if (!createR.ok) throw new Error("Erro ao seguir usuário");

    // atualizar caches (opcional)
    try {
      // followersCount do seguido
      const followersList = await (await fetch(`${BASE}/seguidores?followingId=${Number(followingId)}`)).json();
      await fetch(`${BASE}/usuarios/${Number(followingId)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followersCount: followersList.length })
      });
      // followingCount do seguidor
      const followingList = await (await fetch(`${BASE}/seguidores?followerId=${Number(followerId)}`)).json();
      await fetch(`${BASE}/usuarios/${Number(followerId)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingCount: followingList.length })
      });
    } catch { /* manter a ação mesmo sem cache */ }

    return { followerId, followingId, created: true };
  }
);

// Deixar de seguir (idempotente)
export const unfollowUser = createAsyncThunk(
  "follows/unfollowUser",
  async ({ followerId, followingId }) => {
    const id = key(followerId, followingId);
    const delR = await fetch(`${BASE}/seguidores/${id}`, { method: "DELETE" });
    if (delR.status !== 200 && delR.status !== 204 && delR.status !== 404) {
      throw new Error("Erro ao deixar de seguir");
    }

    // atualizar caches (opcional)
    try {
      const followersList = await (await fetch(`${BASE}/seguidores?followingId=${Number(followingId)}`)).json();
      await fetch(`${BASE}/usuarios/${Number(followingId)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followersCount: followersList.length })
      });
      const followingList = await (await fetch(`${BASE}/seguidores?followerId=${Number(followerId)}`)).json();
      await fetch(`${BASE}/usuarios/${Number(followerId)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingCount: followingList.length })
      });
    } catch {}

    return { followerId, followingId };
  }
);

const followsSlice = createSlice({
  name: "follows",
  initialState: {
    byPair: {}, // `${followerId}-${followingId}` -> { isFollowing, loading, error }
    counts: {}, // userId -> { followersCount, followingCount, loading }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIsFollowing.fulfilled, (state, action) => {
        const { followerId, followingId, isFollowing } = action.payload;
        state.byPair[key(followerId, followingId)] = { isFollowing, loading: false, error: null };
      })
      .addCase(followUser.pending, (state, action) => {
        const { followerId, followingId } = action.meta.arg;
        state.byPair[key(followerId, followingId)] = { isFollowing: true, loading: true, error: null };
      })
      .addCase(followUser.fulfilled, (state, action) => {
        const { followerId, followingId } = action.payload;
        state.byPair[key(followerId, followingId)] = { isFollowing: true, loading: false, error: null };
      })
      .addCase(followUser.rejected, (state, action) => {
        const { followerId, followingId } = action.meta.arg;
        state.byPair[key(followerId, followingId)] = { isFollowing: false, loading: false, error: action.error?.message || "Erro" };
      })
      .addCase(unfollowUser.pending, (state, action) => {
        const { followerId, followingId } = action.meta.arg;
        state.byPair[key(followerId, followingId)] = { isFollowing: false, loading: true, error: null };
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const { followerId, followingId } = action.payload;
        state.byPair[key(followerId, followingId)] = { isFollowing: false, loading: false, error: null };
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        const { followerId, followingId } = action.meta.arg;
        state.byPair[key(followerId, followingId)] = { isFollowing: true, loading: false, error: action.error?.message || "Erro" };
      })
      .addCase(fetchFollowCounts.fulfilled, (state, action) => {
        const { userId, followersCount, followingCount } = action.payload;
        state.counts[Number(userId)] = { followersCount, followingCount, loading: false };
      });
  },
});

export default followsSlice.reducer;

// Selectors
export const selectIsFollowing = (followerId, followingId) => (state) =>
  state.follows.byPair[`${Number(followerId)}-${Number(followingId)}`]?.isFollowing || false;

export const selectFollowCounts = (userId) => (state) =>
  state.follows.counts[Number(userId)] || { followersCount: 0, followingCount: 0, loading: false };
