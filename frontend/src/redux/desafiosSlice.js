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
  
{/*import api from "../api/axios";

// 🔹 Buscar todos os desafios
export const fetchDesafios = createAsyncThunk(
  "desafios/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/challenges");
      return res.data;
    } catch (err) {
      return rejectWithValue("Erro ao buscar desafios");
    }
  }
);

// 🔹 Buscar detalhes de um desafio
export const fetchDesafioById = createAsyncThunk(
  "desafios/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/challenges/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue("Erro ao buscar desafio");
    }
  }
);

// 🔹 Criar novo desafio
export const createDesafio = createAsyncThunk(
  "desafios/create",
  async (novoDesafio, { rejectWithValue }) => {
    try {
      const res = await api.post("/challenges", novoDesafio);
      return res.data;
    } catch (err) {
      return rejectWithValue("Erro ao criar desafio");
    }
  }
);

// 🔹 Participar de um desafio
export const participarDesafio = createAsyncThunk(
  "desafios/participar",
  async ({ desafioId, postId }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/challenges/${desafioId}/participacoes`, {
        postId,
      });
      return { desafioId, participacao: res.data };
    } catch (err) {
      return rejectWithValue("Erro ao participar do desafio");
    }
  }
);

// 🔹 Sair de um desafio (remover participação)
export const sairDesafio = createAsyncThunk(
  "desafios/sair",
  async ({ desafioId, participacaoId }, { rejectWithValue }) => {
    try {
      await api.delete(
        `/challenges/${desafioId}/participacoes/${participacaoId}`
      );
      return { desafioId, participacaoId };
    } catch (err) {
      return rejectWithValue("Erro ao sair do desafio");
    }
  }
);

const desafiosSlice = createSlice({
  name: "desafios",
  initialState: {
    lista: [],
    selecionado: null,
    participacoes: {}, // { [desafioId]: [participações] }
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Buscar todos
      .addCase(fetchDesafios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDesafios.fulfilled, (state, action) => {
        state.lista = action.payload;
        state.loading = false;
      })
      .addCase(fetchDesafios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Buscar único
      .addCase(fetchDesafioById.fulfilled, (state, action) => {
        state.selecionado = action.payload;
      })
      // Criar
      .addCase(createDesafio.fulfilled, (state, action) => {
        state.lista.push(action.payload);
      })
      // Participar
      .addCase(participarDesafio.fulfilled, (state, action) => {
        const { desafioId, participacao } = action.payload;
        if (!state.participacoes[desafioId]) {
          state.participacoes[desafioId] = [];
        }
        state.participacoes[desafioId].push(participacao);
      })
      // Sair
      .addCase(sairDesafio.fulfilled, (state, action) => {
        const { desafioId, participacaoId } = action.payload;
        if (state.participacoes[desafioId]) {
          state.participacoes[desafioId] = state.participacoes[
            desafioId
          ].filter((p) => p.id !== participacaoId);
        }
      });
  },
});

export default desafiosSlice.reducer;

// 🔹 Selectors
export const selectDesafioById = (id) => (state) =>
  state.desafios.lista?.find((d) => Number(d.id) === Number(id)) || null;
export const selectDesafios = (state) => state.desafios.lista || [];
export const selectDesafioSelecionado = (state) => state.desafios.selecionado;
export const selectParticipacoesDesafio = (desafioId) => (state) =>
  state.desafios.participacoes[desafioId] || [];

*/}