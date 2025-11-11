import { Router } from "express";
import { db } from "../store/db.js";
import { nextId, nowISO } from "../store/utils.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// listar desafios
router.get("/", (req, res) => {
  res.json(db.challenges);
});

// criar desafio
router.post("/", requireAuth, (req, res) => {
  const { titulo, descricao, deadline } = req.body || {};
  if (!titulo) return res.status(400).json({ error: "titulo é obrigatório" });
  const desafio = { id: nextId(), titulo, descricao: descricao || "", autorId: req.userId, createdAt: nowISO(), deadline: deadline || null };
  db.challenges.push(desafio);
  res.status(201).json(desafio);
});

// obter por id
router.get("/:id", (req, res) => {
  const d = db.challenges.find(c => String(c.id) === req.params.id);
  if (!d) return res.status(404).json({ error: "Desafio não encontrado" });
  res.json(d);
});

// participações do desafio
router.get("/:id/participacoes", (req, res) => {
  const list = db.participacoes.filter(p => String(p.desafioId) === req.params.id);
  res.json(list);
});

router.post("/:id/participacoes", requireAuth, (req, res) => {
  const { postId } = req.body || {};
  const desafio = db.challenges.find(c => String(c.id) === req.params.id);
  if (!desafio) return res.status(404).json({ error: "Desafio não encontrado" });

  const post = db.posts.find(p => String(p.id) === String(postId) && String(p.usuarioId) === String(req.userId));
  if (!post) return res.status(400).json({ error: "postId inválido ou não pertence ao usuário logado" });

  const ja = db.participacoes.find(p => String(p.desafioId) === String(desafio.id) && String(p.postId) === String(post.id));
  if (ja) return res.status(409).json({ error: "Este post já participa do desafio" });

  const part = { id: nextId(), desafioId: desafio.id, usuarioId: req.userId, postId: post.id, createdAt: nowISO() };
  db.participacoes.push(part);
  res.status(201).json(part);
});

export default router;
