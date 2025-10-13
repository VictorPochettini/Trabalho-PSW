import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/posts";

export const fetchPosts = createAsyncThunk("posts/fetchAll", async () => {
  const res = await axios.get(API_URL);
  return res.data;
});

export const addPost = createAsyncThunk("posts/add", async (novoPost) => {
  const res = await axios.post(API_URL, novoPost);
  return res.data;
});

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
      .addCase(fetchPosts.pending, (s) => { s.loading = true; })
      .addCase(fetchPosts.fulfilled, (s, a) => {
        s.loading = false;
        s.lista = a.payload;
      })
      .addCase(addPost.fulfilled, (s, a) => {
        s.lista.push(a.payload);
      })
      .addCase(fetchPosts.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      });
  }
});

export default postsSlice.reducer;
