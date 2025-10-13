import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./usuariosSlice";
import postsReducer from "./postsSlice";
import desafiosReducer from "./desafiosSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    posts: postsReducer,
    desafios: desafiosReducer
  }
});

export default store;
