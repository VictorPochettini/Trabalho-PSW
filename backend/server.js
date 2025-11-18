import express from "express";
import cors from "cors";
import { conectaDB } from "./server/database.js";

import Avaliacao from "./models/Avaliacao.js";
import Comentario from "./models/Comentario.js";
import Desafio from "./models/Desafio.js";
import Participacao from "./models/Participacao.js";
import Post from "./models/Post.js";
import Seguidor from "./models/Seguidor.js";
import Usuario from "./models/Usuario.js";

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
/*
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
*/

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
app.get("/usuarios", async (req, res) => {
  try
  {
    const usuarios = await Usuario.find();
    res.json(usuarios); 
  }
  catch(error)
  {
    res.status(500).json({error: error.message});
  }
});

app.get("/usuarios/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id); // usa findById e pega o id da URL
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/usuarios", async (req, res) => {
  try {
    const existe = await Usuario.findOne({ username: req.body.username });
    if (existe) {
      return res.status(409).json({ error: "username já existe" });
    }

    const novo = new Usuario(req.body);
    await novo.save();
    res.status(201).json(novo); // retorna o usuário criado
  } catch (error) {
    res.status(400).json({ error: error.message }); // trata erros
  }
});

// PUT substitui o usuário
app.put("/usuarios/:id", async (req, res) => {
  try
  {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new: true, overwrite: true}
    );

    if(!usuario) return res.status(404).json({error: "Usuário não encontrado"});
    res.json(usuario);
  }
  catch(error)
  {
    res.status(400).json({ error: error.message });
  }
});

// PATCH parcial (followersCount, ratingAvgRecebida, etc)
app.patch("/usuarios/:id", async (req, res) => {
  try
  {
  const usuario = await Usuario.findByIdAndUpdate(
    req.params.id, 
    req.body, 
    {new: true});

  if (!usuario) // verifica se encontrou
      return res.status(404).json({ error: "Usuário não encontrado" });

    res.json(usuario);
  }
  catch(error)
  {
    res.status(500).json({error: error.message});
  }
});

// -----------------------------
// /posts
// -----------------------------
app.get("/posts", async (req, res) => {
  try
  {
    const posts = await Post.find();
    res.json(posts);
  }
  catch(error)
  {
    res.status(500).json({error: error.message})
  }
  
});

app.get("/posts/:id", async (req, res) => {
  try
  {
    const post = await Post.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Post não encontrado" });
    res.json(p);
  }
  catch(error)
  {
    res.status(500).json({error: error.message});
  }
});

app.post("/posts", async (req, res) => {
  try
  {
    const novo = new Post(req.body);
    await novo.save();
    res.status(201).json(novo);
  }
  catch(error)
  {
    res.status(500).json({error: error.message});
  }
});

app.patch("/posts/:id", async (req, res) => {
  try
  {
    const post = await Post.findByIdAndUpdate(
    req.params.id, 
    req.body, 
    {new: true});

  if (!post) // verifica se encontrou
      return res.status(404).json({ error: "Post não encontrado" });

    res.json(post);
  }
  catch(error)
  {
    res.status(500).json({error: error.message});
  }
});

app.delete("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: "Post não encontrado" });
    }
    
    res.status(204).end(); // 204 = sucesso sem conteúdo
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// /desafios
// -----------------------------
app.get("/desafios", async (req, res) => {
  try
  {
    const desafio = await Desafio.find();
    res.json(desafio);
  }
  catch(error)
  {
    res.status(500).json({error: error.message});
  }
});

app.get("/desafios/:id", async (req, res) => {
  try
  {
    const desafio = await Desafio.findById(req.params.id)
    if(!desafio) return res.status(404).json({error: "Desafio não encontrado"});
    res.json(desafio);
  }
  catch(error)
  {
    res.status(500).json({error: error.message});
  }
});

app.post("/desafios", async (req, res) => {
  try
  {
    const novo = new Desafio(req.body);
    await novo.save();
    res.status(201).json(novo);
  }
  catch(error)
  {
    res.status(500).json({error: error.message});
  }
});

app.patch("/desafios/:id", async (req, res) => {
  try
  {
    const desafio = await Desafio.findByIdAndUpdate(
    req.params.id, 
    req.body, 
    {new: true});

  if (!desafio) // verifica se encontrou
      return res.status(404).json({ error: "Desafio não encontrado" });

    res.json(desafio);
  }
  catch(error)
  {
    res.status(500).json({error: error.message});
  }
});

// -----------------------------
// /participacoes
// -----------------------------
app.get("/participacoes", async (req, res) => {
  try {
    const { desafioId, usuarioId } = req.query;
    
    // Monta o filtro dinamicamente
    const filtro = {};
    if (desafioId) filtro.desafioId = desafioId;
    if (usuarioId) filtro.usuarioId = usuarioId;
    
    // Busca com o filtro (se estiver vazio, traz tudo)
    const participacoes = await Participacao.find(filtro);
    
    res.json(participacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/participacoes", async (req, res) => {
  try
  {
    const novo = new Participacao(req.body);
    if(!novo.desafioId || !novo.usuarioId || !novo.postId)
      return res.status(400).json({error: "desafioId, usuarioId e postId são obrigatórios"});

    await novo.save();
    res.status(201).json(novo);
  }
  catch(error)
  {
    res.status(500).json({error: error.message});
  }
});

app.delete("/participacoes/:id", async (req, res) => {
  try {
    const part = await Participacoes.findByIdAndDelete(req.params.id);
    
    if (!part) {
      return res.status(404).json({ error: "Participação não encontrada" });
    }
    
    res.status(204).end(); // 204 = sucesso sem conteúdo
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// /comentarios
// -----------------------------
app.get("/comentarios", async (req, res) => {
  try
  {
    const {postId, _sort, _order} = req.query;
    const filtro = {};
    if(postId) filtro.postId = postId;
    
    let query = Comentario.find(filtro);
    
    if(_sort == "createdAt")
    {
      const ordem = _order == "desc" ? -1 : 1;
      query = query.sort({createdAt: ordem});
    }
    
    const comentarios = await query;
    
    res.json(comentarios);
  }
  catch(error)
  {
    res.status(500).json({error: error.message});
  }
});

app.post("/comentarios", async (req, res) => {
  try {
    const body = req.body || {};
    
    // Validação
    if (!body.postId || !body.usuarioId || !body.texto) {
      return res.status(400).json({ 
        error: "postId, usuarioId e texto são obrigatórios" 
      });
    }
    
    // Cria comentário
    const novo = new Comentario({
      ...body,
      updatedAt: new Date() // garante que updatedAt seja atualizado
    });
    
    await novo.save();
    res.status(201).json(novo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/comentarios/:id", async (req, res) => {
  try {
    const comentario = await Comentario.findByIdAndDelete(req.params.id);
    
    if (!comentario) {
      return res.status(404).json({ error: "Comentário não encontrado" });
    }
    
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
