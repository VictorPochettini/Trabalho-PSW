// src/redux/desafiosSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

const API_URL = "/desafios";

// --- AÇÕES ASSÍNCRONAS (THUNKS) ---

/**
 * Busca todos os desafios.
 */
export const fetchDesafios = createAsyncThunk(
  "desafios/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(API_URL);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar desafios");
    }
  }
);

/**
 * Busca um desafio específico por ID.
 */
export const fetchDesafioById = createAsyncThunk(
  "desafios/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao carregar desafio");
    }
  }
);

/**
 * Cria um novo desafio.
 */
export const createDesafio = createAsyncThunk(
  "desafios/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post(API_URL, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao criar desafio");
    }
  }
);

/**
 * Atualiza parcialmente um desafio existente.
 */
export const patchDesafio = createAsyncThunk(
  "desafios/patch",
  async ({ id, patchBody }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`${API_URL}/${id}`, patchBody);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao atualizar desafio");
    }
  }
);

/**
 * Exclui um desafio.
 */
export const deleteDesafio = createAsyncThunk(
  "desafios/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      return id; // Retorna o ID do desafio excluído
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erro ao excluir desafio");
    }
  }
);

// --- SLICE E REDUCERS ---

const desafiosSlice = createSlice({
  name: "desafios",
  initialState: {
    lista: [],
    loading: false,
    error: null,
    byId: {}, // Normalização por ID
  },
  reducers: {},
  extraReducers: (b) => {
    b
      // --- FETCH ALL ---
      .addCase(fetchDesafios.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDesafios.fulfilled, (s, a) => {
        s.loading = false;
        s.lista = a.payload;
        s.byId = {};
        // Normalização dos dados
        a.payload.forEach(d => { s.byId[d._id || d.id] = d; });
      })
      .addCase(fetchDesafios.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error?.message; })

      // --- FETCH BY ID ---
      .addCase(fetchDesafioById.fulfilled, (s, a) => {
        const d = a.payload;
        // Atualiza/Adiciona no byId
        s.byId[d._id || d.id] = d;
        // Atualiza/Adiciona na lista
        const idx = s.lista.findIndex(x => String(x._id || x.id) === String(d._id || d.id));
        if (idx === -1) s.lista.push(d); else s.lista[idx] = d;
      })

      // --- CREATE ---
      .addCase(createDesafio.fulfilled, (s, a) => {
        const d = a.payload;
        s.lista.push(d); // Adiciona na lista
        s.byId[d._id || d.id] = d; // Adiciona no byId
      })

      // --- PATCH / UPDATE ---
      .addCase(patchDesafio.fulfilled, (s, a) => {
        const d = a.payload;
        // Atualiza no byId
        s.byId[d._id || d.id] = d;
        // Atualiza na lista
        const idx = s.lista.findIndex(x => String(x._id || x.id) === String(d._id || d.id));
        if (idx !== -1) s.lista[idx] = d; else s.lista.push(d); // Se por algum motivo não estava na lista, adiciona.
      })

      // --- DELETE ---
      .addCase(deleteDesafio.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(deleteDesafio.fulfilled, (s, a) => {
        s.loading = false;
        const id = a.payload;
        // Remove da lista usando filter (imutável)
        s.lista = s.lista.filter(d => String(d._id || d.id) !== String(id));
        // Remove do byId
        delete s.byId[id];
      })
      .addCase(deleteDesafio.rejected, (s, a) => { 
        s.loading = false; 
        s.error = a.payload || a.error?.message; 
      });
  },
});

export default desafiosSlice.reducer;

// --- SELECTORS ---

/**
 * Seletor que retorna o array completo de desafios.
 */
export const selectDesafios = (state) => state.desafios.lista || [];

/**
 * Seletor de fábrica que busca um desafio por ID (prioriza o byId, fallback para lista).
 */
export const selectDesafioById = (id) => (state) =>
  state.desafios.byId[id] || state.desafios.lista.find(d => String(d._id || d.id) === String(id)) || null;