// src/redux/desafiosSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

const API_URL = "/desafios";

// fetch all
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

// fetch by id
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

// create desafio
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

// patch desafio
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

// ✅ NOVO: delete desafio
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

const desafiosSlice = createSlice({
  name: "desafios",
  initialState: {
    lista: [],
    loading: false,
    error: null,
    byId: {},
  },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchDesafios.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDesafios.fulfilled, (s, a) => {
        s.loading = false;
        s.lista = a.payload;
        s.byId = {};
        a.payload.forEach(d => { s.byId[d._id || d.id] = d; });
      })
      .addCase(fetchDesafios.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error?.message; })

      .addCase(fetchDesafioById.fulfilled, (s, a) => {
        const d = a.payload;
        s.byId[d._id || d.id] = d;
        const idx = s.lista.findIndex(x => String(x._id || x.id) === String(d._id || d.id));
        if (idx === -1) s.lista.push(d); else s.lista[idx] = d;
      })

      .addCase(createDesafio.fulfilled, (s, a) => {
        const d = a.payload;
        s.lista.push(d);
        s.byId[d._id || d.id] = d;
      })

      .addCase(patchDesafio.fulfilled, (s, a) => {
        const d = a.payload;
        s.byId[d._id || d.id] = d;
        const idx = s.lista.findIndex(x => String(x._id || x.id) === String(d._id || d.id));
        if (idx !== -1) s.lista[idx] = d; else s.lista.push(d);
      })

      // ✅ NOVO: deleteDesafio
      .addCase(deleteDesafio.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(deleteDesafio.fulfilled, (s, a) => {
        s.loading = false;
        const id = a.payload;
        // Remove da lista
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

// selectors
export const selectDesafios = (state) => state.desafios.lista || [];
export const selectDesafioById = (id) => (state) =>
  state.desafios.byId[id] || state.desafios.lista.find(d => String(d._id || d.id) === String(id)) || null;