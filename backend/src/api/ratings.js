import { Router } from "express";
import { db } from "../store/db.js";
import { nextId } from "../store/utils.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// avaliar post (1..5)
router.post("/", requireAuth, (req, res) => {
  const { postId, stars } = req.body || {};
  if (!postId || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: "postId e stars(1..5) obrigatórios" });
  }
  const post = db.posts.find(p => p.id === Number(postId));
  if (!post) return res.status(404).json({ error: "Post não encontrado" });

  // um rating por usuário por post
  const existing = db.ratings.find(r => r.postId === post.id && r.userId === req.userId);
  if (existing) {
    existing.stars = stars;
    return res.json(existing);
  }

  const rating = { id: nextId(), postId: post.id, userId: req.userId, stars };
  db.ratings.push(rating);
  res.status(201).json(rating);
});

// média por post
router.get("/avg/:postId", (req, res) => {
  const pid = Number(req.params.postId);
  const rs = db.ratings.filter(r => r.postId === pid);
  const avg = rs.length ? rs.reduce((a, b) => a + b.stars, 0) / rs.length : 0;
  res.json({ postId: pid, count: rs.length, avg });
});

export default router;
