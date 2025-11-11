import { Router } from "express";
import { db } from "../store/db.js";

const router = Router();

// Login simples: username/senha -> token
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = db.users.find(u => u.username === username && u.senha === password);
  if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

  const token = `token_${user.id}_${Date.now()}`;
  db.tokens.set(token, user.id);
  res.json({ token, user });
});

router.post("/logout", (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (token) db.tokens.delete(token);
  res.json({ ok: true });
});

export default router;
