import { Router } from "express";
import { db } from "../store/db.js";
import { nextId, nowISO } from "../store/utils.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// GET /api/posts?tipo=&usuarioId=
router.get("/", (req, res) => {
  const { tipo, usuarioId } = req.query;
  let out = db.posts.slice();
  if (tipo) out = out.filter(p => p.tipo === tipo);
  if (usuarioId) out = out.filter(p => String(p.usuarioId) === String(usuarioId));
  res.json(out);
});

// Criar post
router.post("/", requireAuth, (req, res) => {
  const { tipo, titulo, conteudo } = req.body || {};
  if (!tipo || !conteudo) return res.status(400).json({ error: "tipo e conteudo são obrigatórios" });

  const post = { id: nextId(), usuarioId: req.userId, tipo, titulo: titulo || "", conteudo, createdAt: nowISO() };
  db.posts.push(post);
  res.status(201).json(post);
});

export default router;
