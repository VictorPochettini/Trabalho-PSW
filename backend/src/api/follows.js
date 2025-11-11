import { Router } from "express";
import { db } from "../store/db.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// seguir
router.post("/follow", requireAuth, (req, res) => {
  const { userId } = req.body || {};
  if (String(userId) === String(req.userId)) return res.status(400).json({ error: "Não pode se seguir" });
  const exists = db.follows.find(f => f.followerId === req.userId && f.followingId === Number(userId));
  if (exists) return res.status(409).json({ error: "Já segue" });

  db.follows.push({ followerId: req.userId, followingId: Number(userId) });
  res.status(201).json({ ok: true });
});

// deixar de seguir
router.post("/unfollow", requireAuth, (req, res) => {
  const { userId } = req.body || {};
  const before = db.follows.length;
  db.follows = db.follows.filter(f => !(f.followerId === req.userId && f.followingId === Number(userId)));
  res.json({ removed: before - db.follows.length });
});

// contagens
router.get("/counts/:userId", (req, res) => {
  const uid = Number(req.params.userId);
  const followersCount = db.follows.filter(f => f.followingId === uid).length;
  const followingCount = db.follows.filter(f => f.followerId === uid).length;
  res.json({ userId: uid, followersCount, followingCount });
});

export default router;
