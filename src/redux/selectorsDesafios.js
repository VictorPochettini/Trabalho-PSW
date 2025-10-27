import { createSelector } from "@reduxjs/toolkit";
import { selectParticipacoesByDesafio } from "./participacoesSlice";


export const makeSelectRankingByStars = (desafioId) => createSelector(
[
(s) => s.posts.lista || [],
selectParticipacoesByDesafio(desafioId),
],
(posts, participacoes) => {
const mapPost = new Map(posts.map((p) => [String(p.id), p]));
const rows = (participacoes || []).map((p) => {
const post = mapPost.get(String(p.postId));
const avg = Number(post?.ratingAvg || 0);
const count = Number(post?.ratingCount || 0);
return {
participacaoId: p.id,
desafioId: p.desafioId,
usuarioId: p.usuarioId,
postId: p.postId,
titulo: post?.titulo || "",
tipo: post?.tipo,
ratingAvg: avg,
ratingCount: count,
data: post?.data || p.createdAt,
};
});
rows.sort((a, b) => (
b.ratingAvg - a.ratingAvg ||
b.ratingCount - a.ratingCount ||
new Date(b.data) - new Date(a.data)
));
return rows;
}
);

