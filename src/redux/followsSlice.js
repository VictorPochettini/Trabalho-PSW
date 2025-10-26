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

// NOVAS FUNÇÕES para buscar listas de seguidores e seguindo
export const fetchFollowersList = createAsyncThunk(
  "follows/fetchFollowersList",
  async (userId) => {
    // Busca todos os seguidores do usuário
    const followersRes = await fetch(`${BASE}/seguidores?followingId=${Number(userId)}`);
    if (!followersRes.ok) throw new Error("Erro ao carregar lista de seguidores");
    const followers = await followersRes.json();
    
    // Para cada seguidor, busca os detalhes do usuário
    const followersWithDetails = await Promise.all(
      followers.map(async (follow) => {
        try {
          const userRes = await fetch(`${BASE}/usuarios/${Number(follow.followerId)}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            return {
              id: userData.id,
              nome: userData.nome || userData.name || 'Usuário',
              username: userData.username,
              fotoPerfil: userData.fotoPerfil
            };
          }
        } catch (error) {
          console.error(`Erro ao buscar detalhes do usuário ${follow.followerId}:`, error);
        }
        return {
          id: follow.followerId,
          nome: 'Usuário',
          username: 'usuario',
          fotoPerfil: null
        };
      })
    );
    
    return { userId: Number(userId), followers: followersWithDetails.filter(Boolean) };
  }
);

export const fetchFollowingList = createAsyncThunk(
  "follows/fetchFollowingList",
  async (userId) => {
    // Busca todas as pessoas que o usuário está seguindo
    const followingRes = await fetch(`${BASE}/seguidores?followerId=${Number(userId)}`);
    if (!followingRes.ok) throw new Error("Erro ao carregar lista de seguindo");
    const following = await followingRes.json();
    
    // Para cada pessoa seguida, busca os detalhes do usuário
    const followingWithDetails = await Promise.all(
      following.map(async (follow) => {
        try {
          const userRes = await fetch(`${BASE}/usuarios/${Number(follow.followingId)}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            return {
              id: userData.id,
              nome: userData.nome || userData.name || 'Usuário',
              username: userData.username,
              fotoPerfil: userData.fotoPerfil
            };
          }
        } catch (error) {
          console.error(`Erro ao buscar detalhes do usuário ${follow.followingId}:`, error);
        }
        return {
          id: follow.followingId,
          nome: 'Usuário',
          username: 'usuario',
          fotoPerfil: null
        };
      })
    );
    
    return { userId: Number(userId), following: followingWithDetails.filter(Boolean) };
  }
);

const followsSlice = createSlice({
  name: "follows",
  initialState: {
    byPair: {}, // `${followerId}-${followingId}` -> { isFollowing, loading, error }
    counts: {}, // userId -> { followersCount, followingCount, loading }
    followersLists: {}, // userId -> { list: [], loading: boolean, error: string }
    followingLists: {}, // userId -> { list: [], loading: boolean, error: string }
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
      })
      // NOVOS CASOS para fetchFollowersList
      .addCase(fetchFollowersList.pending, (state, action) => {
        const userId = Number(action.meta.arg);
        state.followersLists[userId] = { list: [], loading: true, error: null };
      })
      .addCase(fetchFollowersList.fulfilled, (state, action) => {
        const { userId, followers } = action.payload;
        state.followersLists[userId] = { list: followers, loading: false, error: null };
      })
      .addCase(fetchFollowersList.rejected, (state, action) => {
        const userId = Number(action.meta.arg);
        state.followersLists[userId] = { 
          list: [], 
          loading: false, 
          error: action.error?.message || "Erro ao carregar seguidores" 
        };
      })
      
      // NOVOS CASOS para fetchFollowingList
      .addCase(fetchFollowingList.pending, (state, action) => {
        const userId = Number(action.meta.arg);
        state.followingLists[userId] = { list: [], loading: true, error: null };
      })
      .addCase(fetchFollowingList.fulfilled, (state, action) => {
        const { userId, following } = action.payload;
        state.followingLists[userId] = { list: following, loading: false, error: null };
      })
      .addCase(fetchFollowingList.rejected, (state, action) => {
        const userId = Number(action.meta.arg);
        state.followingLists[userId] = { 
          list: [], 
          loading: false, 
          error: action.error?.message || "Erro ao carregar lista de seguindo" 
        };
      });
  },
});

export default followsSlice.reducer;

// Selectors
export const selectIsFollowing = (followerId, followingId) => (state) =>
  state.follows.byPair[`${Number(followerId)}-${Number(followingId)}`]?.isFollowing || false;

export const selectFollowCounts = (userId) => (state) =>
  state.follows.counts[Number(userId)] || { followersCount: 0, followingCount: 0, loading: false };
// NOVOS SELECTORS para as listas
export const selectFollowersList = (userId) => (state) =>
  state.follows.followersLists[Number(userId)] || { list: [], loading: false, error: null };

export const selectFollowingList = (userId) => (state) =>
  state.follows.followingLists[Number(userId)] || { list: [], loading: false, error: null };
