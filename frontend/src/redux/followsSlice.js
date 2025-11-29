// src/redux/followsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

const API_URL = "/follows";

// Thunks
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

// NOVOS THUNKS para contagem e listas
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

// Slice
const followsSlice = createSlice({
  name: "follows",
  initialState: {
    // Estrutura: { "followerId_followingId": true/false }
    following: {},
    // Estrutura: { userId: { followersCount, followingCount } }
    counts: {},
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
      .addCase(fetchIsFollowing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIsFollowing.fulfilled, (state, action) => {
        state.loading = false;
        const { followerId, followingId, isFollowing } = action.payload;
        const key = `${followerId}_${followingId}`;
        state.following[key] = isFollowing;
      })
      .addCase(fetchIsFollowing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // followUser - atualiza estado imediatamente
      .addCase(followUser.pending, (state, action) => {
        // Atualização otimista
        const { followerId, followingId } = action.meta.arg;
        const key = `${followerId}_${followingId}`;
        state.following[key] = true;
        state.error = null;
        
        // Atualiza contagens otimisticamente
        if (state.counts[followingId]) {
          state.counts[followingId].followersCount++;
        }
        if (state.counts[followerId]) {
          state.counts[followerId].followingCount++;
        }
      })
      .addCase(followUser.fulfilled, (state, action) => {
        const { followerId, followingId } = action.payload;
        const key = `${followerId}_${followingId}`;
        state.following[key] = true;
      })
      .addCase(followUser.rejected, (state, action) => {
        // Reverte atualização otimista em caso de erro
        const { followerId, followingId } = action.meta.arg;
        const key = `${followerId}_${followingId}`;
        state.following[key] = false;
        
        // Reverte contagens
        if (state.counts[followingId]) {
          state.counts[followingId].followersCount--;
        }
        if (state.counts[followerId]) {
          state.counts[followerId].followingCount--;
        }
        
        state.error = action.payload || action.error?.message;
      })

      // unfollowUser - atualiza estado imediatamente
      .addCase(unfollowUser.pending, (state, action) => {
        // Atualização otimista
        const { followerId, followingId } = action.meta.arg;
        const key = `${followerId}_${followingId}`;
        state.following[key] = false;
        state.error = null;
        
        // Atualiza contagens otimisticamente
        if (state.counts[followingId]) {
          state.counts[followingId].followersCount--;
        }
        if (state.counts[followerId]) {
          state.counts[followerId].followingCount--;
        }
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const { followerId, followingId } = action.payload;
        const key = `${followerId}_${followingId}`;
        state.following[key] = false;
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        // Reverte atualização otimista em caso de erro
        const { followerId, followingId } = action.meta.arg;
        const key = `${followerId}_${followingId}`;
        state.following[key] = true;
        
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
      .addCase(fetchFollowCounts.rejected, (state, action) => {
        state.error = action.payload || action.error?.message;
      })

      // fetchFollowersList
      .addCase(fetchFollowersList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFollowersList.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchFollowersList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // fetchFollowingList
      .addCase(fetchFollowingList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFollowingList.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchFollowingList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });
  },
});

export const { clearFollowsError } = followsSlice.actions;

// Selectors
export const selectIsFollowing = (followerId, followingId) => (state) => {
  if (!followerId || !followingId) return false;
  const key = `${followerId}_${followingId}`;
  return state.follows.following[key] || false;
};

export const selectFollowCounts = (userId) => (state) => {
  if (!userId) return { followersCount: 0, followingCount: 0 };
  return state.follows.counts[userId] || { followersCount: 0, followingCount: 0 };
};

export const selectFollowsLoading = (state) => state.follows.loading;
export const selectFollowsError = (state) => state.follows.error;

export default followsSlice.reducer;