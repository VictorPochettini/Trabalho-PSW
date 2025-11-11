import { db } from "../store/db.js";

export function requireAuth(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !db.tokens.has(token)) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  req.userId = db.tokens.get(token);
  next();
}
