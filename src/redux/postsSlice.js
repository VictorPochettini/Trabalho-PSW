// src/redux/postsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/posts";

// Buscar todos os posts
export const fetchPosts = createAsyncThunk(
  "posts/fetchAll",
  async () => {
    const res = await axios.get(API_URL);
    return res.data;
  }
);

// Adicionar um post (data incluída automaticamente)
export const addPost = createAsyncThunk(
  "posts/add",
  async (novoPost) => {
    const postComData = {
      ...novoPost,
      data: new Date().toISOString()
    };
    const res = await axios.post(API_URL, postComData);
    return res.data;
  }
);

// ✅ Remover um post
export const deletePost = createAsyncThunk(
  "posts/delete",
  async (id) => {
    // json-server: DELETE /posts/:id
    await axios.delete(`${API_URL}/${id}`);
    // retornamos o id para facilitar remover do estado
    return id;
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState: {
    lista: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchPosts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.lista = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Erro ao carregar posts";
      })

      // add
      .addCase(addPost.fulfilled, (state, action) => {
        state.lista.push(action.payload);
      })

      // ✅ delete
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        const removedId = String(action.payload);
        state.lista = state.lista.filter(p => String(p.id) !== removedId);
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Erro ao excluir post";
      });
  }
});

export default postsSlice.reducer;
