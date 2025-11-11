import { Router } from "express";
import { db } from "../store/db.js";
import { nextId } from "../store/utils.js";

const router = Router();

// Listar usuários
router.get("/", (req, res) => {
  res.json(db.users.map(u => ({ id: u.id, username: u.username, nome: u.nome, admin: u.admin })));
});

// Criar usuário
router.post("/", (req, res) => {
  const { username, nome, senha, admin = false } = req.body || {};
  if (!username || !senha) return res.status(400).json({ error: "username e senha são obrigatórios" });
  if (db.users.some(u => u.username === username)) return res.status(409).json({ error: "username já existe" });

  const novo = { id: nextId(), username, nome: nome || username, senha, admin };
  db.users.push(novo);
  res.status(201).json({ id: novo.id, username: novo.username, nome: novo.nome, admin: novo.admin });
});

export default router;
