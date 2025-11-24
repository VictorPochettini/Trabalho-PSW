// src/redux/followsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

function key(followerId, followingId) {
  return `${String(followerId)}-${String(followingId)}`;
}

// verifica relação (GET /seguidores?followerId=&followingId=)
export const fetchIsFollowing = createAsyncThunk(
  "follows/fetchIsFollowing",
  async ({ followerId, followingId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/seguidores?followerId=${followerId}&followingId=${followingId}`);
      const isFollowing = Array.isArray(res.data) && res.data.length > 0;
      return { followerId, followingId, isFollowing };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao verificar follow");
    }
  }
);

// buscar contagens
export const fetchFollowCounts = createAsyncThunk(
  "follows/fetchCounts",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        api.get(`/seguidores?followingId=${userId}`),
        api.get(`/seguidores?followerId=${userId}`)
      ]);
      return { userId, followersCount: followersRes.data.length, followingCount: followingRes.data.length };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar contagens");
    }
  }
);

// seguir
export const followUser = createAsyncThunk(
  "follows/followUser",
  async ({ followerId, followingId }, { rejectWithValue }) => {
    try {
      // id composed is optional — backend /seguidores POST expects followerId & followingId
      const res = await api.post("/seguidores", { followerId, followingId });
      // atualizar contagens
      await api.patch(`/usuarios/${followingId}`, {}); // opcional - backend pode calcular
      return { followerId, followingId, created: true, item: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao seguir usuário");
    }
  }
);

// unfollow
export const unfollowUser = createAsyncThunk(
  "follows/unfollowUser",
  async ({ followerId, followingId }, { rejectWithValue }) => {
    try {
      // buscar relação para remover (backend supports GET /seguidores?followerId=&followingId=)
      const res = await api.get(`/seguidores?followerId=${followerId}&followingId=${followingId}`);
      const rel = Array.isArray(res.data) ? res.data[0] : null;
      if (rel && (rel._id || rel.id)) {
        await api.delete(`/seguidores/${rel._id || rel.id}`);
      }
      return { followerId, followingId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao deixar de seguir");
    }
  }
);

// buscar listas (followers / following) com detalhes do usuário
export const fetchFollowersList = createAsyncThunk(
  "follows/fetchFollowersList",
  async (userId, { rejectWithValue }) => {
    try {
      const followersRes = await api.get(`/seguidores?followingId=${userId}`);
      const followers = followersRes.data;
      const followersWithDetails = await Promise.all(followers.map(async (f) => {
        try {
          const u = (await api.get(`/usuarios/${f.followerId}`)).data;
          return { id: u._id || u.id, nome: u.name || u.nome, username: u.username, fotoPerfil: u.fotoPerfil };
        } catch {
          return { id: f.followerId, nome: "Usuário", username: "usuario", fotoPerfil: null };
        }
      }));
      return { userId, followers: followersWithDetails };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar seguidores");
    }
  }
);

export const fetchFollowingList = createAsyncThunk(
  "follows/fetchFollowingList",
  async (userId, { rejectWithValue }) => {
    try {
      const followingRes = await api.get(`/seguidores?followerId=${userId}`);
      const following = followingRes.data;
      const followingWithDetails = await Promise.all(following.map(async (f) => {
        try {
          const u = (await api.get(`/usuarios/${f.followingId}`)).data;
          return { id: u._id || u.id, nome: u.name || u.nome, username: u.username, fotoPerfil: u.fotoPerfil };
        } catch {
          return { id: f.followingId, nome: "Usuário", username: "usuario", fotoPerfil: null };
        }
      }));
      return { userId, following: followingWithDetails };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar seguindo");
    }
  }
);

const followsSlice = createSlice({
  name: "follows",
  initialState: {
    byPair: {}, // key -> { isFollowing, loading, error }
    counts: {}, // userId -> { followersCount, followingCount, loading }
    followersLists: {},
    followingLists: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchIsFollowing.fulfilled, (s, a) => {
        const { followerId, followingId, isFollowing } = a.payload;
        s.byPair[key(followerId, followingId)] = { isFollowing, loading: false, error: null };
      })
      .addCase(fetchIsFollowing.rejected, (s, a) => {
        const { followerId, followingId } = a.meta.arg;
        s.byPair[key(followerId, followingId)] = { isFollowing: false, loading: false, error: a.payload || a.error?.message };
      })

      .addCase(followUser.pending, (s, a) => {
        const { followerId, followingId } = a.meta.arg;
        s.byPair[key(followerId, followingId)] = { isFollowing: true, loading: true, error: null };
      })
      .addCase(followUser.fulfilled, (s, a) => {
        const { followerId, followingId } = a.payload;
        s.byPair[key(followerId, followingId)] = { isFollowing: true, loading: false, error: null };
      })
      .addCase(followUser.rejected, (s, a) => {
        const { followerId, followingId } = a.meta.arg;
        s.byPair[key(followerId, followingId)] = { isFollowing: false, loading: false, error: a.payload || a.error?.message };
      })

      .addCase(unfollowUser.fulfilled, (s, a) => {
        const { followerId, followingId } = a.payload;
        s.byPair[key(followerId, followingId)] = { isFollowing: false, loading: false, error: null };
      })
      .addCase(unfollowUser.rejected, (s, a) => {
        const { followerId, followingId } = a.meta.arg;
        s.byPair[key(followerId, followingId)] = { isFollowing: true, loading: false, error: a.payload || a.error?.message };
      })

      .addCase(fetchFollowCounts.fulfilled, (s, a) => {
        const { userId, followersCount, followingCount } = a.payload;
        s.counts[userId] = { followersCount, followingCount, loading: false };
      })
      .addCase(fetchFollowersList.fulfilled, (s, a) => {
        s.followersLists[a.payload.userId] = { list: a.payload.followers, loading: false, error: null };
      })
      .addCase(fetchFollowingList.fulfilled, (s, a) => {
        s.followingLists[a.payload.userId] = { list: a.payload.following, loading: false, error: null };
      })
      .addMatcher((action) => action.type.endsWith("/rejected") && action.type.includes("follows"), (s, a) => {
        s.error = a.payload || a.error?.message;
      });
  },
});

export default followsSlice.reducer;

// selectors
export const selectIsFollowing = (followerId, followingId) => (state) =>
  state.follows.byPair[key(followerId, followingId)]?.isFollowing || false;

export const selectFollowCounts = (userId) => (state) =>
  state.follows.counts[Number(userId)] || { followersCount: 0, followingCount: 0, loading: false };

export const selectFollowersList = (userId) => (state) =>
  state.follows.followersLists[Number(userId)] || { list: [], loading: false, error: null };

export const selectFollowingList = (userId) => (state) =>
  state.follows.followingLists[Number(userId)] || { list: [], loading: false, error: null };
