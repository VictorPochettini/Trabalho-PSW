// src/store/db.js
export const db = {
  users: [
    { id: 1, username: "juan", nome: "Juan", senha: "123", admin: false },
    { id: 2, username: "maria", nome: "Maria", senha: "123", admin: false }
  ],
  posts: [
    // { id, usuarioId, tipo: 'imagem'|'musica'|'letra', titulo, conteudo, createdAt }
  ],
  challenges: [
    // { id, titulo, descricao, autorId, createdAt, deadline }
  ],
  participacoes: [
    // { id, desafioId, usuarioId, postId, createdAt }
  ],
  follows: [
    // { followerId, followingId }
  ],
  ratings: [
    // { id, postId, userId, stars }
  ],
  tokens: new Map() // token -> userId (para mock de auth simples)
};
