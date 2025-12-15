// src/redux/selectorsDesafios.js
import { createSelector } from "@reduxjs/toolkit";
// Importar seletores necessários de outros slices
import { selectParticipacoesByDesafio } from "./participacoesSlice"; 
import { selectAllPosts } from "./postsSlice"; // Nota: No código fornecido, 'selectAllPosts' não é usado diretamente, mas sim `s.posts.lista`. Mantendo o import para boas práticas.

/**
 * Seletor de fábrica que retorna um ranking das participações de um desafio
 * ordenado pela média de estrelas (ratingAvg), contagem de avaliações, e data.
 * * Este seletor combina:
 * 1. Todos os posts em cache (para obter ratingAvg).
 * 2. Todas as participações para o desafioId específico.
 * * @param {string} desafioId - O ID do desafio para o qual o ranking deve ser gerado.
 * @returns {Array<object>} Ranking ordenado de participações.
 */
export const makeSelectRankingByStars = (desafioId) => createSelector(
  [
    // Fonte 1: Todos os posts (usado para mapeamento de rating)
    (s) => s.posts.lista || [], 
    // Fonte 2: Participações específicas do desafio (cache ou lista geral)
    selectParticipacoesByDesafio(desafioId), 
  ],
  (posts, participacoes) => {
    // 1. Criar um mapa de Posts para acesso rápido O(1)
    const mapPost = new Map(posts.map((p) => [String(p._id || p.id), p]));
    
    // 2. Mapear Participações para Linhas do Ranking
    const rows = (participacoes || []).map((p) => {
      const postId = String(p.postId);
      const post = mapPost.get(postId);
      
      // Extrair ratings do Post (pode vir de diferentes campos dependendo da API)
      const avg = Number(post?.ratingAvg || post?.ratingAvgRecebida || 0);
      const count = Number(post?.ratingCount || 0);

      return {
        participacaoId: p._id || p.id,
        desafioId: p.desafioId,
        usuarioId: p.usuarioId,
        postId: postId,
        titulo: post?.titulo || post?.title || "",
        tipo: post?.tipo,
        ratingAvg: avg,
        ratingCount: count,
        data: post?.createdAt || post?.data || p.createdAt,
      };
    });

    // 3. Ordenar as Linhas do Ranking
    // Critério 1: Média de estrelas (Decrescente)
    // Critério 2: Contagem de avaliações (Decrescente)
    // Critério 3: Data de criação (Mais recente primeiro)
    rows.sort((a, b) => {
      // 1. ratingAvg
      if (b.ratingAvg !== a.ratingAvg) return b.ratingAvg - a.ratingAvg;
      
      // 2. ratingCount
      if (b.ratingCount !== a.ratingCount) return b.ratingCount - a.ratingCount;
      
      // 3. Data (Mais recente primeiro)
      return new Date(b.data) - new Date(a.data);
    });

    return rows;
  }
);