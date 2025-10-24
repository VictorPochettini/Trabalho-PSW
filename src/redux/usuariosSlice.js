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
