import { createSlice } from "@reduxjs/toolkit";

const accounts = [ {username:'admin', password:'admin'}, {username: "diogo", password: "cefet"} ];

const initialState = {
  currentUser: null,
  error: null
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      const { username, password } = action.payload;
      const user = accounts.find(
        u => u.username === username && u.password === password
      );
      if (user) {
        state.currentUser = { username: user.username, name: user.name };
        state.error = null;
      } else {
        state.error = "Usuário ou senha inválidos";
      }
    },
    logout: (state) => {
      state.currentUser = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const { login, logout, clearError } = userSlice.actions;
export default userSlice.reducer;
