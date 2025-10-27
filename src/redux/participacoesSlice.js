// src/redux/participacoesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = "http://localhost:5000/participacoes";

// --- THUNKS (definidos antes do slice) ---
export const fetchParticipacoesByDesafio = createAsyncThunk(
  "participacoes/fetchByDesafio",
  async (desafioId) => {
    const { data } = await axios.get(`${API}?desafioId=${desafioId}`);
    return data;
  }
);

export const fetchParticipacoesByUsuario = createAsyncThunk(
  "participacoes/fetchByUsuario",
  async (usuarioId) => {
    const { data } = await axios.get(`${API}?usuarioId=${usuarioId}`);
    return data;
  }
);

export const createParticipacao = createAsyncThunk(
  "participacoes/create",
  async (body) => {
    const { data } = await axios.post(API, body);
    return data;
  }
);

export const deleteParticipacao = createAsyncThunk(
  "participacoes/delete",
  async (id) => {
    await axios.delete(`${API}/${id}`);
    return { id };
  }
);

// --- SLICE ---
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
      .addCase(fetchParticipacoesByDesafio.pending, (s) => {
        s.loading = true; s.error = null;
      })
      .addCase(fetchParticipacoesByDesafio.fulfilled, (s, a) => {
        s.loading = false;
        s.byDesafioId[a.meta.arg] = a.payload;
      })
      .addCase(fetchParticipacoesByDesafio.rejected, (s, a) => {
        s.loading = false; s.error = a.error.message;
      })
      .addCase(fetchParticipacoesByUsuario.fulfilled, (s, a) => {
        s.byUsuarioId[a.meta.arg] = a.payload;
      })
      .addCase(createParticipacao.fulfilled, (s, a) => {
        const p = a.payload;
        if (!s.byDesafioId[p.desafioId]) s.byDesafioId[p.desafioId] = [];
        s.byDesafioId[p.desafioId].push(p);
        if (!s.byUsuarioId[p.usuarioId]) s.byUsuarioId[p.usuarioId] = [];
        s.byUsuarioId[p.usuarioId].push(p);
      })
      .addCase(deleteParticipacao.fulfilled, (s, a) => {
        const { id } = a.payload;
        for (const k of Object.keys(s.byDesafioId)) {
          s.byDesafioId[k] = (s.byDesafioId[k] || []).filter((x) => String(x.id) !== String(id));
        }
        for (const k of Object.keys(s.byUsuarioId)) {
          s.byUsuarioId[k] = (s.byUsuarioId[k] || []).filter((x) => String(x.id) !== String(id));
        }
      });
  },
});

export default participacoesSlice.reducer;

// --- SELECTORS ---
export const selectParticipacoesByDesafio = (desafioId) => (s) =>
  s.participacoes.byDesafioId[desafioId] || [];

export const selectParticipacoesByUsuario = (usuarioId) => (s) =>
  s.participacoes.byUsuarioId[usuarioId] || [];
