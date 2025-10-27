// src/redux/desafiosSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/desafios";

// --- THUNKS ---
export const fetchDesafios = createAsyncThunk(
  "desafios/fetchAll",
  async () => {
    const res = await axios.get(API_URL);
    return res.data;
  }
);

export const fetchDesafioById = createAsyncThunk(
  "desafios/fetchById",
  async (id) => {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
  }
);

export const createDesafio = createAsyncThunk(
  "desafios/create",
  async (payload) => {
    const res = await axios.post(API_URL, payload);
    return res.data;
  }
);

export const patchDesafio = createAsyncThunk(
  "desafios/patch",
  async ({ id, patchBody }) => {
    const res = await axios.patch(`${API_URL}/${id}`, patchBody);
    return res.data;
  }
);

// --- SLICE ---
const desafiosSlice = createSlice({
  name: "desafios",
  initialState: {
    lista: [],
    loading: false,
    error: null,
    byId: {}, // cache opcional para acesso rápido
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchDesafios.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDesafios.fulfilled, (s, a) => {
        s.loading = false;
        s.lista = a.payload;
        s.byId = {};
        a.payload.forEach((d) => { s.byId[d.id] = d; });
      })
      .addCase(fetchDesafios.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error?.message || "Erro ao carregar desafios";
      })
      // fetchById
      .addCase(fetchDesafioById.fulfilled, (s, a) => {
        const d = a.payload;
        s.byId[d.id] = d;
        const idx = s.lista.findIndex((x) => String(x.id) === String(d.id));
        if (idx === -1) s.lista.push(d); else s.lista[idx] = d;
      })
      // create
      .addCase(createDesafio.fulfilled, (s, a) => {
        const d = a.payload;
        s.lista.push(d);
        s.byId[d.id] = d;
      })
      // patch
      .addCase(patchDesafio.fulfilled, (s, a) => {
        const d = a.payload;
        s.byId[d.id] = d;
        const idx = s.lista.findIndex((x) => String(x.id) === String(d.id));
        if (idx !== -1) s.lista[idx] = d; else s.lista.push(d);
      });
  },
});

export default desafiosSlice.reducer;

// --- SELECTORS ---
export const selectDesafios = (state) => state.desafios.lista || [];
export const selectDesafioById = (id) => (state) =>
  state.desafios.byId[id] ||
  state.desafios.lista.find((d) => String(d.id) === String(id)) ||
  null;
