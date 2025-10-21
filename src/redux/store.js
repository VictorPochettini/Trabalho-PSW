import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./usuariosSlice";
import postsReducer from "./postsSlice";
import desafiosReducer from "./desafiosSlice";
import commentsReducer from "./commentsSlice";
import ratingsReducer from "./ratingsSlice";
import followsReducer from "./followsSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    posts: postsReducer,
    desafios: desafiosReducer,
    comments: commentsReducer,
    ratings: ratingsReducer,
    follows: followsReducer,
  }
});

export default store;
