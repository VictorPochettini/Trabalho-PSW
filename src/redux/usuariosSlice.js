// src/redux/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_URL = "http://localhost:5000/usuarios";

// Thunk assíncrono para login
export const login = createAsyncThunk(
  "user/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const res = await axios.get(API_URL);
      const user = res.data.find(
        (u) => u.username === username && u.senha === password
      );
      if (!user) return rejectWithValue("Usuário ou senha inválidos");
      return user;
    } catch (err) {
      return rejectWithValue("Erro ao conectar ao servidor");
    }
  }
);

// Thunk assíncrono para buscar todos os usuários
export const fetchUsuarios = createAsyncThunk(
  "user/fetchUsuarios",
  async () => {
    const res = await axios.get(API_URL);
    return res.data;
  }
);

export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (dadosAtualizados, { getState, rejectWithValue }) => {
    try {
      const { currentUser } = getState().user;

      const res = await axios.put(`${API_URL}/${currentUser.id}`, {
        ...currentUser,
        ...dadosAtualizados,
      });

      return res.data;
    } catch (err) {
      return rejectWithValue("Erro ao atualizar o usuário");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    currentUser: null,
    usuarios: [],   // <-- array para armazenar todos os usuários
    error: null,
    loading: false
  },
  reducers: {
    logout: (state) => {
      state.currentUser = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchUsuarios
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
        state.error = action.error.message;
      })
      // updateUser
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;

        // também atualiza o array de usuários, se existir
        const index = state.usuarios.findIndex(
          (u) => u.id === action.payload.id
        );
        if (index !== -1) {
          state.usuarios[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError } = userSlice.actions;
export default userSlice.reducer;

{/*import api from "../api/axios";

// 🔹 Login real via backend (JWT)
export const login = createAsyncThunk(
  "user/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", { username, password });
      return res.data; // deve conter { user, token }
    } catch (err) {
      const message =
        err.response?.data?.error || "Falha ao autenticar. Verifique suas credenciais.";
      return rejectWithValue(message);
    }
  }
);

// 🔹 Buscar todos os usuários (exige token)
export const fetchUsuarios = createAsyncThunk(
  "user/fetchUsuarios",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/users");
      return res.data;
    } catch (err) {
      return rejectWithValue("Erro ao buscar usuários");
    }
  }
);

// 🔹 Atualizar dados do usuário logado
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (dadosAtualizados, { getState, rejectWithValue }) => {
    try {
      const { currentUser } = getState().user;
      if (!currentUser?.user?.id) throw new Error("Usuário não autenticado.");

      const res = await api.put(`/users/${currentUser.user.id}`, {
        ...currentUser.user,
        ...dadosAtualizados,
      });

      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || "Erro ao atualizar usuário";
      return rejectWithValue(message);
    }
  }
);

const usuarioSlice = createSlice({
  name: "user",
  initialState: {
    currentUser: null, // { user: {...}, token: "..." }
    usuarios: [],
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.currentUser = null;
      state.error = null;
      // remover token persistido, se houver
      localStorage.removeItem("token");
    },
    clearError: (state) => {
      state.error = null;
    },
    setUserFromStorage: (state) => {
      const stored = localStorage.getItem("userData");
      if (stored) {
        try {
          state.currentUser = JSON.parse(stored);
        } catch {
          localStorage.removeItem("userData");
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        // persiste login no localStorage
        localStorage.setItem("userData", JSON.stringify(action.payload));
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Buscar usuários
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
        state.error = action.payload;
      })

      // Atualizar usuário
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentUser?.user?.id === action.payload.id) {
          state.currentUser.user = action.payload;
          // atualiza localStorage
          localStorage.setItem("userData", JSON.stringify(state.currentUser));
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, setUserFromStorage } = usuarioSlice.actions;
export default usuarioSlice.reducer;

// 🔹 Selectors
export const selectCurrentUser = (state) => state.user.currentUser?.user || null;
export const selectAuthToken = (state) => state.user.currentUser?.token || null;
export const selectUsuarios = (state) => state.user.usuarios || [];
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;

*/}