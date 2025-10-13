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
      data: new Date().toISOString() // gera timestamp atual
    };
    const res = await axios.post(API_URL, postComData);
    return res.data;
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
      .addCase(fetchPosts.pending, (state) => { state.loading = true; })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.lista = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addPost.fulfilled, (state, action) => {
        state.lista.push(action.payload);
      });
  }
});

export default postsSlice.reducer;
