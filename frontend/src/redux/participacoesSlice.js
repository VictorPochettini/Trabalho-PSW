// src/redux/participacoesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

const API_URL = "/participacoes";

// --- AÇÕES ASSÍNCRAS (THUNKS) ---

/**
 * Busca todas as participações (com filtro opcional por desafioId).
 * @param {object} filtro - { desafioId: string }
 */
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

/**
 * Busca participações de um desafio específico.
 * @param {string} desafioId
 */
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

/**
 * Cria uma nova participação em um desafio.
 */
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

/**
 * Exclui uma participação pelo seu ID.
 */
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

// --- SLICE E REDUCERS ---

const participacoesSlice = createSlice({
  name: "participacoes",
  initialState: {
    lista: [],          // Cache de todas as participações carregadas
    byDesafio: {},      // Cache normalizado por desafioId: { desafioId: [participacoes] }
    loading: false,     // Status de carregamento
    error: null,        // Mensagem de erro
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- fetchParticipacoes (Geral) ---
      .addCase(fetchParticipacoes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParticipacoes.fulfilled, (state, action) => {
        state.loading = false;
        // Se a chamada não usou filtro, substitui a lista principal.
        // NOTA: Se usou filtro, o estado 'lista' pode não refletir todos os dados.
        // A lógica do seletor é robusta para lidar com isso.
        state.lista = action.payload; 
      })
      .addCase(fetchParticipacoes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // --- fetchParticipacoesByDesafio ---
      .addCase(fetchParticipacoesByDesafio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParticipacoesByDesafio.fulfilled, (state, action) => {
        state.loading = false;
        const participacoes = action.payload;
        
        if (participacoes.length > 0) {
          const desafioId = String(participacoes[0].desafioId);
          // 1. Cacheia no byDesafio (substitui a lista específica)
          state.byDesafio[desafioId] = participacoes;
        }
        
        // 2. Atualiza lista geral (merge/upsert)
        participacoes.forEach(p => {
          const id = String(p._id || p.id);
          const idx = state.lista.findIndex(x => String(x._id || x.id) === id);
          if (idx === -1) {
            state.lista.push(p);
          } else {
            state.lista[idx] = p; // Atualiza dado existente
          }
        });
      })
      .addCase(fetchParticipacoesByDesafio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // --- createParticipacao ---
      .addCase(createParticipacao.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createParticipacao.fulfilled, (state, action) => {
        state.loading = false;
        const novaParticipacao = action.payload;
        const desafioId = String(novaParticipacao.desafioId);

        // 1. Adiciona à lista geral
        state.lista.push(novaParticipacao);
        
        // 2. Adiciona ao byDesafio
        if (!state.byDesafio[desafioId]) {
          state.byDesafio[desafioId] = [];
        }
        state.byDesafio[desafioId].push(novaParticipacao);
      })
      .addCase(createParticipacao.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // --- deleteParticipacao ---
      .addCase(deleteParticipacao.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteParticipacao.fulfilled, (state, action) => {
        state.loading = false;
        const id = String(action.payload);
        
        // 1. Remove da lista geral
        state.lista = state.lista.filter(p => String(p._id || p.id) !== id);
        
        // 2. Remove do byDesafio (itera sobre todas as chaves)
        Object.keys(state.byDesafio).forEach(desafioId => {
          state.byDesafio[desafioId] = state.byDesafio[desafioId].filter(
            p => String(p._id || p.id) !== id
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

// --- SELECTORS ---

/**
 * Retorna o array geral de todas as participações carregadas.
 */
export const selectParticipacoes = (state) => state.participacoes?.lista || [];

/**
 * Seletor de fábrica que busca participações pelo desafioId.
 * Prioriza o cache otimizado 'byDesafio' e usa 'lista' como fallback.
 * @param {string} desafioId
 */
export const selectParticipacoesByDesafio = (desafioId) => (state) => {
  if (!desafioId) return [];
  
  // Tenta primeiro do cache byDesafio (mais rápido se já estiver carregado)
  if (state.participacoes?.byDesafio?.[desafioId]) {
    return state.participacoes.byDesafio[desafioId];
  }
  
  // Fallback: filtra da lista geral
  return (state.participacoes?.lista || []).filter(
    p => String(p.desafioId) === String(desafioId)
  );
};

/**
 * Seletor de fábrica que busca participações de um usuário específico (filtra da lista geral).
 * @param {string} usuarioId
 */
export const selectParticipacoesByUsuario = (usuarioId) => (state) => {
  if (!usuarioId) return [];
  
  return (state.participacoes?.lista || []).filter(
    p => String(p.usuarioId) === String(usuarioId)
  );
};