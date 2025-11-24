// src/redux/selectorsDesafios.js
import { createSelector } from "@reduxjs/toolkit";
import { selectParticipacoesByDesafio } from "./participacoesSlice";
import { selectAllPosts } from "./postsSlice";

export const makeSelectRankingByStars = (desafioId) => createSelector(
  [
    (s) => s.posts.lista || [],
    selectParticipacoesByDesafio(desafioId),
  ],
  (posts, participacoes) => {
    const mapPost = new Map(posts.map((p) => [String(p._id || p.id), p]));
    const rows = (participacoes || []).map((p) => {
      const post = mapPost.get(String(p.postId));
      const avg = Number(post?.ratingAvg || post?.ratingAvgRecebida || 0);
      const count = Number(post?.ratingCount || post?.ratingCount || 0);
      return {
        participacaoId: p._id || p.id,
        desafioId: p.desafioId,
        usuarioId: p.usuarioId,
        postId: p.postId,
        titulo: post?.titulo || post?.title || "",
        tipo: post?.tipo,
        ratingAvg: avg,
        ratingCount: count,
        data: post?.createdAt || post?.data || p.createdAt,
      };
    });
    rows.sort((a, b) => {
      if (b.ratingAvg !== a.ratingAvg) return b.ratingAvg - a.ratingAvg;
      if (b.ratingCount !== a.ratingCount) return b.ratingCount - a.ratingCount;
      return new Date(b.data) - new Date(a.data);
    });
    return rows;
  }
);
