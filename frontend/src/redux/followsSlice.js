// src/redux/followsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

const API_URL = "/follows";

// --- AÇÕES ASSÍNCRONAS (THUNKS) ---

/**
 * Verifica se um usuário está seguindo outro.
 */
export const fetchIsFollowing = createAsyncThunk(
  "follows/fetchIsFollowing",
  async ({ followerId, followingId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}/is-following`, {
        params: { followerId, followingId }
      });
      return { 
        followerId, 
        followingId, 
        isFollowing: res.data.isFollowing || false 
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao verificar seguidor");
    }
  }
);

/**
 * Inicia a relação de seguir.
 */
export const followUser = createAsyncThunk(
  "follows/followUser",
  async ({ followerId, followingId }, { rejectWithValue }) => {
    try {
      const res = await api.post(API_URL, { followerId, followingId });
      return { followerId, followingId, data: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao seguir usuário");
    }
  }
);

/**
 * Encerra a relação de seguir.
 */
export const unfollowUser = createAsyncThunk(
  "follows/unfollowUser",
  async ({ followerId, followingId }, { rejectWithValue }) => {
    try {
      await api.delete(API_URL, {
        data: { followerId, followingId }
      });
      return { followerId, followingId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao deixar de seguir");
    }
  }
);

/**
 * Busca as contagens de seguidores/seguindo de um usuário.
 */
export const fetchFollowCounts = createAsyncThunk(
  "follows/fetchFollowCounts",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}/counts/${userId}`);
      return { 
        userId, 
        followersCount: res.data.followersCount || 0,
        followingCount: res.data.followingCount || 0
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao buscar contagens");
    }
  }
);

/**
 * Busca a lista de seguidores de um usuário.
 */
export const fetchFollowersList = createAsyncThunk(
  "follows/fetchFollowersList",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}/followers/${userId}`);
      return { 
        userId,
        followers: res.data.followers || []
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao buscar seguidores");
    }
  }
);

/**
 * Busca a lista de usuários que um usuário está seguindo.
 */
export const fetchFollowingList = createAsyncThunk(
  "follows/fetchFollowingList",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}/following/${userId}`);
      return { 
        userId,
        following: res.data.following || []
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao buscar seguindo");
    }
  }
);

// --- SLICE E REDUCERS ---

const followsSlice = createSlice({
  name: "follows",
  initialState: {
    following: {},        // Cache de status 'followerId_followingId': true/false
    myFollowingList: [],  // Lista de IDs que o usuário atual está seguindo
    counts: {},           // Cache de contagens por userId
    loading: false,
    error: null,
  },
  reducers: {
    clearFollowsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchIsFollowing
      .addCase(fetchIsFollowing.fulfilled, (state, action) => {
        state.loading = false;
        const { followerId, followingId, isFollowing } = action.payload;
        const key = `${followerId}_${followingId}`;
        state.following[key] = isFollowing;
      })

      // followUser PENDING (Otimista)
      .addCase(followUser.pending, (state, action) => {
        const { followerId, followingId } = action.meta.arg;
        const key = `${followerId}_${followingId}`;
        state.following[key] = true;
        state.error = null;
        
        const followingIdStr = String(followingId);
        if (!state.myFollowingList.includes(followingIdStr)) {
          state.myFollowingList.push(followingIdStr);
        }
        
        // Incrementa contagens (Otimista)
        if (state.counts[followingId]) {
          state.counts[followingId].followersCount++;
        }
        if (state.counts[followerId]) {
          state.counts[followerId].followingCount++;
        }
      })
      // followUser REJECTED (Reversão)
      .addCase(followUser.rejected, (state, action) => {
        const { followerId, followingId } = action.meta.arg;
        const key = `${followerId}_${followingId}`;
        state.following[key] = false;
        
        const followingIdStr = String(followingId);
        state.myFollowingList = state.myFollowingList.filter(id => id !== followingIdStr);
        
        // Reverte contagens
        if (state.counts[followingId] && state.counts[followingId].followersCount > 0) {
          state.counts[followingId].followersCount--;
        }
        if (state.counts[followerId] && state.counts[followerId].followingCount > 0) {
          state.counts[followerId].followingCount--;
        }
        state.error = action.payload || action.error?.message;
      })

      // unfollowUser PENDING (Otimista)
      .addCase(unfollowUser.pending, (state, action) => {
        const { followerId, followingId } = action.meta.arg;
        const key = `${followerId}_${followingId}`;
        state.following[key] = false;
        state.error = null;
        
        const followingIdStr = String(followingId);
        state.myFollowingList = state.myFollowingList.filter(id => id !== followingIdStr);
        
        // Decrementa contagens (Otimista)
        if (state.counts[followingId] && state.counts[followingId].followersCount > 0) {
          state.counts[followingId].followersCount--;
        }
        if (state.counts[followerId] && state.counts[followerId].followingCount > 0) {
          state.counts[followerId].followingCount--;
        }
      })
      // unfollowUser REJECTED (Reversão)
      .addCase(unfollowUser.rejected, (state, action) => {
        const { followerId, followingId } = action.meta.arg;
        const key = `${followerId}_${followingId}`;
        state.following[key] = true;
        
        const followingIdStr = String(followingId);
        if (!state.myFollowingList.includes(followingIdStr)) {
          state.myFollowingList.push(followingIdStr);
        }
        
        // Reverte contagens
        if (state.counts[followingId]) {
          state.counts[followingId].followersCount++;
        }
        if (state.counts[followerId]) {
          state.counts[followerId].followingCount++;
        }
        state.error = action.payload || action.error?.message;
      })

      // fetchFollowCounts
      .addCase(fetchFollowCounts.fulfilled, (state, action) => {
        const { userId, followersCount, followingCount } = action.payload;
        state.counts[userId] = { followersCount, followingCount };
      })
      
      // fetchFollowingList
      .addCase(fetchFollowingList.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, following } = action.payload;
        // Popula a lista de IDs
        state.myFollowingList = following.map(u => String(u._id || u.id));
        // Popula o cache 'following' para o usuário atual
        following.forEach(u => {
          const targetId = String(u._id || u.id);
          const key = `${userId}_${targetId}`;
          state.following[key] = true;
        });
      });
  },
});

export const { clearFollowsError } = followsSlice.actions;
export default followsSlice.reducer;

// --- SELECTORS ---

/**
 * Seletor de fábrica que verifica se followerId está seguindo followingId.
 */
export const selectIsFollowing = (followerId, followingId) => (state) => {
  if (!followerId || !followingId) return false;
  const key = `${followerId}_${followingId}`;
  return state.follows.following[key] || false;
};

/**
 * Seletor de fábrica que retorna as contagens de seguidores/seguindo para um userId.
 */
export const selectFollowCounts = (userId) => (state) => {
  if (!userId) return { followersCount: 0, followingCount: 0 };
  return state.follows.counts[userId] || { followersCount: 0, followingCount: 0 };
};

/**
 * Retorna a lista de IDs dos usuários que o usuário atual está seguindo.
 */
export const selectMyFollowingList = (state) => state.follows.myFollowingList || [];