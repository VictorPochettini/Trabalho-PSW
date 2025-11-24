// src/redux/participacoesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// endpoint
const API = "/participacoes";

// buscar participações de um desafio
export const fetchParticipacoesByDesafio = createAsyncThunk(
  "participacoes/fetchByDesafio",
  async (desafioId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API}?desafioId=${desafioId}`);
      return { desafioId, items: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar participações");
    }
  }
);

// buscar participações de um usuário
export const fetchParticipacoesByUsuario = createAsyncThunk(
  "participacoes/fetchByUsuario",
  async (usuarioId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API}?usuarioId=${usuarioId}`);
      return { usuarioId, items: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar participações do usuário");
    }
  }
);

// criar participação (body deve conter desafioId e postId; usuarioId será associado se não enviado)
export const createParticipacao = createAsyncThunk(
  "participacoes/create",
  async (body, { getState, rejectWithValue }) => {
    try {
      // se o body não tiver usuarioId, usa o logado
      if (!body.usuarioId) {
        const current = getState().user.currentUser;
        const uid = current?.user?._id || current?.user?.id;
        if (!uid) return rejectWithValue("Usuário não autenticado");
        body.usuarioId = uid;
      }
      const res = await api.post(API, body);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao criar participação");
    }
  }
);

// deletar participação (aplica checagem de ownership no backend)
export const deleteParticipacao = createAsyncThunk(
  "participacoes/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API}/${id}`);
      return { id };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao excluir participação");
    }
  }
);

const participacoesSlice = createSlice({
  name: "participacoes",
  initialState: {
    byDesafioId: {}, // desafioId -> lista
    byUsuarioId: {}, // usuarioId -> lista
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchParticipacoesByDesafio.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchParticipacoesByDesafio.fulfilled, (s, a) => {
        s.loading = false;
        s.byDesafioId[a.payload.desafioId] = a.payload.items;
      })
      .addCase(fetchParticipacoesByDesafio.rejected, (s, a) => {
        s.loading = false; s.error = a.payload || a.error.message;
      })

      .addCase(fetchParticipacoesByUsuario.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchParticipacoesByUsuario.fulfilled, (s, a) => {
        s.loading = false;
        s.byUsuarioId[a.payload.usuarioId] = a.payload.items;
      })
      .addCase(fetchParticipacoesByUsuario.rejected, (s, a) => {
        s.loading = false; s.error = a.payload || a.error.message;
      })

      .addCase(createParticipacao.fulfilled, (s, a) => {
        const p = a.payload;
        const desafioKey = p.desafioId;
        const usuarioKey = p.usuarioId;
        if (!s.byDesafioId[desafioKey]) s.byDesafioId[desafioKey] = [];
        s.byDesafioId[desafioKey].push(p);
        if (!s.byUsuarioId[usuarioKey]) s.byUsuarioId[usuarioKey] = [];
        s.byUsuarioId[usuarioKey].push(p);
      })
      .addCase(deleteParticipacao.fulfilled, (s, a) => {
        const { id } = a.payload;
        for (const k of Object.keys(s.byDesafioId)) {
          s.byDesafioId[k] = (s.byDesafioId[k] || []).filter(x => String(x._id || x.id) !== String(id));
        }
        for (const k of Object.keys(s.byUsuarioId)) {
          s.byUsuarioId[k] = (s.byUsuarioId[k] || []).filter(x => String(x._id || x.id) !== String(id));
        }
      })
      .addMatcher((action) => action.type.endsWith("/rejected") && action.type.includes("participacoes"), (s, a) => {
        s.error = a.payload || a.error?.message;
      });
  },
});

export default participacoesSlice.reducer;

// selectors
export const selectParticipacoesByDesafio = (desafioId) => (state) =>
  state.participacoes.byDesafioId[desafioId] || [];

export const selectParticipacoesByUsuario = (usuarioId) => (state) =>
  state.participacoes.byUsuarioId[usuarioId] || [];
