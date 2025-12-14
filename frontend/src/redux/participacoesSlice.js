// src/redux/participacoesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

const API_URL = "/participacoes";

// ✅ Buscar todas as participações (com filtro opcional por desafioId)
export const fetchParticipacoes = createAsyncThunk(
  "participacoes/fetchAll",
  async (filtro = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filtro.desafioId) params.append('desafioId', filtro.desafioId);
      
      const url = params.toString() ? `${API_URL}?${params}` : API_URL;
      const res = await api.get(url);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Erro ao carregar participações");
    }
  }
);

// ✅ Buscar participações de um desafio específico
export const fetchParticipacoesByDesafio = createAsyncThunk(
  "participacoes/fetchByDesafio",
  async (desafioId, { rejectWithValue }) => {
    try {
      const res = await api.get(`${API_URL}?desafioId=${desafioId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Erro ao carregar participações");
    }
  }
);

// ✅ Criar participação
export const createParticipacao = createAsyncThunk(
  "participacoes/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post(API_URL, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Erro ao criar participação");
    }
  }
);

// ✅ Excluir participação
export const deleteParticipacao = createAsyncThunk(
  "participacoes/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Erro ao excluir participação");
    }
  }
);

const participacoesSlice = createSlice({
  name: "participacoes",
  initialState: {
    lista: [],
    byDesafio: {}, // { desafioId: [participacoes] }
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchParticipacoes
      .addCase(fetchParticipacoes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParticipacoes.fulfilled, (state, action) => {
        state.loading = false;
        state.lista = action.payload;
      })
      .addCase(fetchParticipacoes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // fetchParticipacoesByDesafio
      .addCase(fetchParticipacoesByDesafio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParticipacoesByDesafio.fulfilled, (state, action) => {
        state.loading = false;
        const participacoes = action.payload;
        
        // Agrupa por desafioId
        if (participacoes.length > 0) {
          const desafioId = participacoes[0].desafioId;
          state.byDesafio[desafioId] = participacoes;
        }
        
        // Atualiza lista geral (merge)
        participacoes.forEach(p => {
          const idx = state.lista.findIndex(x => String(x._id || x.id) === String(p._id || p.id));
          if (idx === -1) {
            state.lista.push(p);
          } else {
            state.lista[idx] = p;
          }
        });
      })
      .addCase(fetchParticipacoesByDesafio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // createParticipacao
      .addCase(createParticipacao.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createParticipacao.fulfilled, (state, action) => {
        state.loading = false;
        const novaParticipacao = action.payload;
        
        // Adiciona à lista geral
        state.lista.push(novaParticipacao);
        
        // Adiciona ao byDesafio
        const desafioId = novaParticipacao.desafioId;
        if (!state.byDesafio[desafioId]) {
          state.byDesafio[desafioId] = [];
        }
        state.byDesafio[desafioId].push(novaParticipacao);
      })
      .addCase(createParticipacao.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // deleteParticipacao
      .addCase(deleteParticipacao.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteParticipacao.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload;
        
        // Remove da lista geral
        state.lista = state.lista.filter(p => String(p._id || p.id) !== String(id));
        
        // Remove do byDesafio
        Object.keys(state.byDesafio).forEach(desafioId => {
          state.byDesafio[desafioId] = state.byDesafio[desafioId].filter(
            p => String(p._id || p.id) !== String(id)
          );
        });
      })
      .addCase(deleteParticipacao.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });
  },
});

export default participacoesSlice.reducer;

// ✅ Selectors
export const selectParticipacoes = (state) => state.participacoes?.lista || [];

export const selectParticipacoesByDesafio = (desafioId) => (state) => {
  if (!desafioId) return [];
  
  // Tenta primeiro do cache byDesafio
  if (state.participacoes?.byDesafio?.[desafioId]) {
    return state.participacoes.byDesafio[desafioId];
  }
  
  // Fallback: filtra da lista geral
  return (state.participacoes?.lista || []).filter(
    p => String(p.desafioId) === String(desafioId)
  );
};

export const selectParticipacoesByUsuario = (usuarioId) => (state) => {
  if (!usuarioId) return [];
  
  return (state.participacoes?.lista || []).filter(
    p => String(p.usuarioId) === String(usuarioId)
  );
};