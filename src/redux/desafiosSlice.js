import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/desafios";

export const fetchDesafios = createAsyncThunk("desafios/fetchAll", async () => {
  const res = await axios.get(API_URL);
  return res.data;
});

const desafiosSlice = createSlice({
  name: "desafios",
  initialState: {
    lista: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDesafios.pending, (s) => { s.loading = true; })
      .addCase(fetchDesafios.fulfilled, (s, a) => {
        s.loading = false;
        s.lista = a.payload;
      })
      .addCase(fetchDesafios.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      });
  }
});

export default desafiosSlice.reducer;
