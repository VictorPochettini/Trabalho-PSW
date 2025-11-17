import express from "express";
import cors from "cors";
import { conectaDB } from "./server/database.js";
import dotenv from "dotenv";
dotenv.config();

// conecta no MongoDB ANTES de tudo
await conectaDB();

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------
// "Banco" em memória
// -----------------------------
let nextNumericId = 1;
const genId = () => nextNumericId++;

// coleções em memória
let usuarios = [
  {
    id: genId(),
    username: "juan",
    nome: "Juan",
    senha: "123",
    followersCount: 0,
    followingCount: 0,
    ratingAvgRecebida: 0,
    ratingCountRecebida: 0,
  },
];

let posts = [];
let desafios = [];
let comentarios = [];
let seguidores = [];    // { id: "1-2", followerId, followingId, createdAt }
let participacoes = []; // { id, desafioId, usuarioId, postId, createdAt }
let avaliacoes = [];    // { id: "postId-usuarioId", postId, usuarioId, estrelas, createdAt, updatedAt }

// -----------------------------
// Helpers
// -----------------------------
const findById = (arr, id) => arr.find((x) => String(x.id) === String(id));

const removeById = (arr, id) => {
  const idx = arr.findIndex((x) => String(x.id) === String(id));
  if (idx !== -1) arr.splice(idx, 1);
};

// -----------------------------
// Rota raiz (só pra não ver "Cannot GET /")
// -----------------------------
app.get("/", (req, res) => {
  res.send("API ArtBeat rodando 🚀");
});

// -----------------------------
// /usuarios
// -----------------------------
app.get("/usuarios", (req, res) => {
  res.json(usuarios);
});

app.get("/usuarios/:id", (req, res) => {
  const u = findById(usuarios, req.params.id);
  if (!u) return res.status(404).json({ error: "Usuário não encontrado" });
  res.json(u);
});

app.post("/usuarios", (req, res) => {
  const body = req.body || {};
  if (!body.username || !body.senha) {
    return res.status(400).json({ error: "username e senha são obrigatórios" });
  }
  if (usuarios.some((u) => u.username === body.username)) {
    return res.status(409).json({ error: "username já existe" });
  }
  const novo = {
    id: genId(),
    nome: body.nome || body.username,
    followersCount: 0,
    followingCount: 0,
    ratingAvgRecebida: 0,
    ratingCountRecebida: 0,
    ...body,
  };
  usuarios.push(novo);
  res.status(201).json(novo);
});

// PUT substitui o usuário
app.put("/usuarios/:id", (req, res) => {
  const id = req.params.id;
  const idx = usuarios.findIndex((u) => String(u.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: "Usuário não encontrado" });

  usuarios[idx] = { ...req.body, id: usuarios[idx].id };
  res.json(usuarios[idx]);
});

// PATCH parcial (followersCount, ratingAvgRecebida, etc)
app.patch("/usuarios/:id", (req, res) => {
  const id = req.params.id;
  const u = findById(usuarios, id);
  if (!u) return res.status(404).json({ error: "Usuário não encontrado" });
  Object.assign(u, req.body || {});
  res.json(u);
});

// -----------------------------
// /posts
// -----------------------------
app.get("/posts", (req, res) => {
  const { usuarioId, _embed } = req.query;
  let result = posts;

  if (usuarioId) {
    result = result.filter((p) => String(p.usuarioId) === String(usuarioId));
  }

  if (_embed === "avaliacoes") {
    result = result.map((p) => ({
      ...p,
      avaliacoes: avaliacoes.filter((a) => Number(a.postId) === Number(p.id)),
    }));
  }

  res.json(result);
});

app.get("/posts/:id", (req, res) => {
  const p = findById(posts, req.params.id);
  if (!p) return res.status(404).json({ error: "Post não encontrado" });
  res.json(p);
});

app.post("/posts", (req, res) => {
  const body = req.body || {};
  if (!body.usuarioId) {
    return res.status(400).json({ error: "usuarioId é obrigatório" });
  }
  const novo = {
    id: genId(),
    data: body.data || new Date().toISOString(),
    ratingAvg: 0,
    ratingCount: 0,
    ...body,
  };
  posts.push(novo);
  res.status(201).json(novo);
});

app.patch("/posts/:id", (req, res) => {
  const p = findById(posts, req.params.id);
  if (!p) return res.status(404).json({ error: "Post não encontrado" });
  Object.assign(p, req.body || {});
  res.json(p);
});

app.delete("/posts/:id", (req, res) => {
  removeById(posts, req.params.id);
  res.status(204).end();
});

// -----------------------------
// /desafios
// -----------------------------
app.get("/desafios", (req, res) => {
  res.json(desafios);
});

app.get("/desafios/:id", (req, res) => {
  const d = findById(desafios, req.params.id);
  if (!d) return res.status(404).json({ error: "Desafio não encontrado" });
  res.json(d);
});

app.post("/desafios", (req, res) => {
  const body = req.body || {};
  if (!body.titulo) {
    return res.status(400).json({ error: "titulo é obrigatório" });
  }
  const novo = {
    id: genId(),
    createdAt: new Date().toISOString(),
    ...body,
  };
  desafios.push(novo);
  res.status(201).json(novo);
});

app.patch("/desafios/:id", (req, res) => {
  const d = findById(desafios, req.params.id);
  if (!d) return res.status(404).json({ error: "Desafio não encontrado" });
  Object.assign(d, req.body || {});
  res.json(d);
});

// -----------------------------
// /participacoes
// -----------------------------
app.get("/participacoes", (req, res) => {
  const { desafioId, usuarioId } = req.query;
  let result = participacoes;

  if (desafioId) {
    result = result.filter(
      (p) => String(p.desafioId) === String(desafioId)
    );
  }
  if (usuarioId) {
    result = result.filter(
      (p) => String(p.usuarioId) === String(usuarioId)
    );
  }

  res.json(result);
});

app.post("/participacoes", (req, res) => {
  const body = req.body || {};
  if (!body.desafioId || !body.usuarioId || !body.postId) {
    return res
      .status(400)
      .json({ error: "desafioId, usuarioId e postId são obrigatórios" });
  }
  const nova = {
    id: genId(),
    createdAt: new Date().toISOString(),
    ...body,
  };
  participacoes.push(nova);
  res.status(201).json(nova);
});

app.delete("/participacoes/:id", (req, res) => {
  removeById(participacoes, req.params.id);
  res.status(204).end();
});

// -----------------------------
// /comentarios
// -----------------------------
app.get("/comentarios", (req, res) => {
  const { postId, _sort, _order } = req.query;
  let result = comentarios;

  if (postId) {
    result = result.filter((c) => String(c.postId) === String(postId));
  }

  if (_sort === "createdAt") {
    result = result.slice().sort((a, b) => {
      const da = new Date(a.createdAt || 0);
      const db = new Date(b.createdAt || 0);
      return _order === "desc" ? db - da : da - db;
    });
  }

  res.json(result);
});

app.post("/comentarios", (req, res) => {
  const body = req.body || {};
  if (!body.postId || !body.usuarioId || !body.texto) {
    return res
      .status(400)
      .json({ error: "postId, usuarioId e texto são obrigatórios" });
  }
  const now = new Date().toISOString();
  const novo = {
    id: genId(),
    parentId: null,
    likes: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...body,
  };
  comentarios.push(novo);
  res.status(201).json(novo);
});

app.delete("/comentarios/:id", (req, res) => {
  removeById(comentarios, req.params.id);
  res.status(204).end();
});

// -----------------------------
// /seguidores (follows)
// -----------------------------
app.get("/seguidores", (req, res) => {
  const { followerId, followingId } = req.query;
  let result = seguidores;

  if (followerId) {
    result = result.filter(
      (f) => String(f.followerId) === String(followerId)
    );
  }
  if (followingId) {
    result = result.filter(
      (f) => String(f.followingId) === String(followingId)
    );
  }

  res.json(result);
});

app.get("/seguidores/:id", (req, res) => {
  const seg = findById(seguidores, req.params.id); // aqui id é a string "follower-following"
  if (!seg) return res.status(404).json({ error: "Relação não encontrada" });
  res.json(seg);
});

app.post("/seguidores", (req, res) => {
  const body = req.body || {};
  if (!body.id || !body.followerId || !body.followingId) {
    return res.status(400).json({ error: "id, followerId e followingId são obrigatórios" });
  }
  if (findById(seguidores, body.id)) {
    return res.status(409).json({ error: "Relacionamento já existe" });
  }
  const now = new Date().toISOString();
  const novo = {
    createdAt: now,
    ...body,
  };
  seguidores.push(novo);
  res.status(201).json(novo);
});

app.delete("/seguidores/:id", (req, res) => {
  removeById(seguidores, req.params.id);
  res.status(204).end();
});

// -----------------------------
// /avaliacoes (ratings)
// -----------------------------
app.get("/avaliacoes", (req, res) => {
  const { postId } = req.query;
  let result = avaliacoes;
  if (postId) {
    result = result.filter(
      (a) => String(a.postId) === String(postId)
    );
  }
  res.json(result);
});

app.get("/avaliacoes/:id", (req, res) => {
  const a = findById(avaliacoes, req.params.id); // id = "postId-usuarioId"
  if (!a) return res.status(404).json({ error: "Avaliação não encontrada" });
  res.json(a);
});

app.post("/avaliacoes", (req, res) => {
  const body = req.body || {};
  if (!body.id || !body.postId || !body.usuarioId) {
    return res
      .status(400)
      .json({ error: "id, postId e usuarioId são obrigatórios" });
  }
  if (findById(avaliacoes, body.id)) {
    return res.status(409).json({ error: "Avaliação já existe" });
  }
  const now = new Date().toISOString();
  const nova = {
    createdAt: now,
    updatedAt: now,
    ...body,
  };
  avaliacoes.push(nova);
  res.status(201).json(nova);
});

app.patch("/avaliacoes/:id", (req, res) => {
  const a = findById(avaliacoes, req.params.id);
  if (!a) return res.status(404).json({ error: "Avaliação não encontrada" });
  Object.assign(a, req.body || {}, { updatedAt: new Date().toISOString() });
  res.json(a);
});

app.delete("/avaliacoes/:id", (req, res) => {
  removeById(avaliacoes, req.params.id);
  res.status(204).end();
});

// -----------------------------
// Start
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
