import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./usuariosSlice";
import postsReducer from "./postsSlice";
import desafiosReducer from "./desafiosSlice";
import commentsReducer from "./commentsSlice";
import ratingsReducer from "./ratingsSlice";
import followsReducer from "./followsSlice";
import participacoesReducer from "./participacoesSlice";

/**
 * Configura e cria o store central do Redux.
 * O configureStore automaticamente:
 * 1. Combina os reducers fornecidos.
 * 2. Adiciona o Redux Thunk como middleware padrão.
 * 3. Configura o Redux DevTools Extension (para desenvolvimento).
 */
const store = configureStore({
  reducer: {
    // Módulos principais (Autenticação/Perfil)
    user: userReducer, 
    
    // Módulos de Conteúdo e Engajamento
    posts: postsReducer,
    comments: commentsReducer,
    ratings: ratingsReducer,
    follows: followsReducer,
    
    // Módulos de Desafios e Gamificação
    desafios: desafiosReducer,
    participacoes: participacoesReducer,
  }
});

export default store;

// --- TIPAGEM (Para projetos TypeScript) ---
/**
 * Tipo para o estado raiz (RootState)
 * Obter o tipo do estado do store a partir do próprio store.
 */
// export type RootState = ReturnType<typeof store.getState>;

/**
 * Tipo para o Dispatch
 * Obter o tipo do dispatch do store (inclui Thunks)
 */
// export type AppDispatch = typeof store.dispatch;