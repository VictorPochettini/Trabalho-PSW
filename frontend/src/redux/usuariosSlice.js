// src/redux/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// 🔐 Login via backend (/api/auth/login) usando username + password
export const login = createAsyncThunk(
  "user/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      // Se o backend esperar { email, password }, troque aqui.
      const res = await api.post("/api/auth/login", { username, password });

      // Esperado algo como: { user: {...}, accessToken: '...', refreshToken? }
      const data = res.data;

      const token = data.accessToken || data.token || data.access_token;
      const user = data.user || data.usuario || data;

      if (!token || !user) {
        return rejectWithValue("Resposta de login inválida do servidor");
      }

      // persiste no localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify({ user, token }));

      return { user, token };
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Falha ao autenticar. Verifique suas credenciais.";
      return rejectWithValue(message);
    }
  }
);

// 🔄 Carrega usuário do storage ao iniciar o app
export const setUserFromStorage = createAsyncThunk(
  "user/setUserFromStorage",
  async (_, { rejectWithValue }) => {
    try {
      const stored = localStorage.getItem("userData");
      if (!stored) return rejectWithValue("No stored user");
      const parsed = JSON.parse(stored);
      return parsed;
    } catch (err) {
      localStorage.removeItem("userData");
      localStorage.removeItem("token");
      return rejectWithValue("Failed to read stored user");
    }
  }
);

// 👥 Buscar todos os usuários (exige token, enviado via api/axios interceptor)
export const fetchUsuarios = createAsyncThunk(
  "user/fetchUsuarios",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/usuarios");
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || "Erro ao buscar usuários";
      return rejectWithValue(message);
    }
  }
);

// ✏️ Atualizar dados do usuário logado
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (dadosAtualizados, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const current = state.user.currentUser; // { user, token }
      const user = current?.user;

      if (!user || (!user.id && !user._id)) {
        throw new Error("Usuário não autenticado.");
      }

      const id = user.id || user._id;

      // Usamos PATCH para atualizar parcialmente sem sobrescrever tudo
      const res = await api.patch(`/usuarios/${id}`, {
        ...dadosAtualizados,
      });

      const updated = res.data;

      // atualiza localStorage se o usuário atualizado for o logado
      const storedRaw = localStorage.getItem("userData");
      if (storedRaw) {
        try {
          const stored = JSON.parse(storedRaw);
          if (
            stored.user &&
            (stored.user.id === updated.id || stored.user._id === updated._id)
          ) {
            const newStored = { ...stored, user: updated };
            localStorage.setItem("userData", JSON.stringify(newStored));
          }
        } catch {
          // se der erro, limpamos para não quebrar
          localStorage.removeItem("userData");
        }
      }

      return updated;
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Erro ao atualizar usuário";
      return rejectWithValue(message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    // currentUser: { user: {...}, token: '...' } após login
    currentUser: null,
    usuarios: [],
    loading: false,
    error: null,
  },
  reducers: {
    // 🚪 Logout local: limpa storage e state
    logout: (state) => {
      state.currentUser = null;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔐 login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = {
          user: action.payload.user,
          token: action.payload.token,
        };
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // 🔄 setUserFromStorage
      .addCase(setUserFromStorage.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })
      .addCase(setUserFromStorage.rejected, (state) => {
        state.currentUser = null;
      })

      // 👥 fetchUsuarios
      .addCase(fetchUsuarios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsuarios.fulfilled, (state, action) => {
        state.loading = false;
        state.usuarios = action.payload;
      })
      .addCase(fetchUsuarios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // ✏️ updateUser
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;

        // atualiza currentUser.user se for o mesmo usuário
        if (
          state.currentUser?.user &&
          (state.currentUser.user.id === action.payload.id ||
            state.currentUser.user._id === action.payload._id)
        ) {
          state.currentUser.user = action.payload;
          localStorage.setItem(
            "userData",
            JSON.stringify(state.currentUser)
          );
        }

        // também atualiza lista usuarios
        const idx = state.usuarios.findIndex(
          (u) => u.id === action.payload.id || u._id === action.payload._id
        );
        if (idx !== -1) state.usuarios[idx] = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });
  },
});

export const { logout, clearError } = userSlice.actions;

// Selectors
export const selectCurrentUser = (state) =>
  state.user.currentUser?.user || null;
export const selectAuthToken = (state) =>
  state.user.currentUser?.token || localStorage.getItem("token");
export const selectUsuarios = (state) => state.user.usuarios || [];
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;

export default userSlice.reducer;
