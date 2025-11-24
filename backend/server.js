// server.js (ES modules) - adaptado para Opção B (registro via /api/auth/register)
import dotenv from 'dotenv';
dotenv.config(); // carregue .env apenas uma vez, no entrypoint

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';

import { conectaDB } from './server/database.js';

// modelos
import Avaliacao from './models/Avaliacao.js';
import Comentario from './models/Comentario.js';
import Desafio from './models/Desafio.js';
import Participacao from './models/Participacao.js';
import Post from './models/Post.js';
import Seguidor from './models/Seguidor.js';
import Usuario from './models/Usuario.js';

// inicializa passport (configura strategy JWT)
import './server/passport.js';

// rotas de autenticação (registro/login/refresh/logout)
import authRoutes from './server/routes/auth.js';

// middlewares de auth reutilizáveis
import { requireAuth /*, requireOwnership, requireRole */ } from './server/middleware/auth.js';

// conecta no MongoDB ANTES de tudo
await conectaDB();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// rate limiter básico para endpoints sensíveis
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth', authLimiter);

// rota raiz
app.get('/', (req, res) => res.send('API ArtBeat rodando 🚀'));

// rotas de auth (registro / login / token / logout)
app.use('/api/auth', authRoutes);

// -----------------------------
// /usuarios
// GET pública para listar (retirando campos sensíveis)
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password -refreshTokens');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password -refreshTokens');
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /usuarios removido em favor de /api/auth/register
// Para evitar inconsistência, devolvemos instrução para usar /api/auth/register
app.post('/usuarios', (req, res) => {
  return res.status(405).json({
    error: 'Método não permitido. Para registrar use POST /api/auth/register'
  });
});

// atualizar usuário inteiro (PUT) -> exige autenticação e ownership/admin
app.put('/usuarios/:id', requireAuth, async (req, res) => {
  try {
    // ownership check: apenas dono ou admin
    if (String(req.user._id) !== String(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Não permitir alteração direta de campos sensíveis como refreshTokens
    const update = { ...req.body };
    delete update.refreshTokens;
    delete update.password; // se quiser permitir mudança de senha, crie endpoint específico que faz hash

    const usuario = await Usuario.findByIdAndUpdate(req.params.id, update, {
      new: true,
      overwrite: true,
    }).select('-password -refreshTokens');

    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH parcial (ex.: followersCount) -> exige auth e ownership/admin quando apropriado
app.patch('/usuarios/:id', requireAuth, async (req, res) => {
  try {
    if (String(req.user._id) !== String(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const update = { ...req.body };
    delete update.refreshTokens;
    delete update.password; // use endpoint específico para troca de senha

    const usuario = await Usuario.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password -refreshTokens');
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// /posts (criar/editar/deletar protegidos e com ownership)
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// criar post -> exige autenticação (associa autor ao req.user._id)
app.post('/posts', requireAuth, async (req, res) => {
  try {
    const novo = new Post({ ...req.body, author: req.user._id });
    await novo.save();
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// atualizar post -> exige auth e ownership
app.patch('/posts/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });

    if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    Object.assign(post, req.body, { updatedAt: new Date() });
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// deletar post -> exige auth e ownership
app.delete('/posts/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });

    if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// /desafios (criação/edição protegidas)
app.get('/desafios', async (req, res) => {
  try {
    const desafio = await Desafio.find();
    res.json(desafio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/desafios/:id', async (req, res) => {
  try {
    const desafio = await Desafio.findById(req.params.id);
    if (!desafio) return res.status(404).json({ error: 'Desafio não encontrado' });
    res.json(desafio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/desafios', requireAuth, async (req, res) => {
  try {
    const novo = new Desafio({ ...req.body, createdBy: req.user._id });
    await novo.save();
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/desafios/:id', requireAuth, async (req, res) => {
  try {
    const desafio = await Desafio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!desafio) return res.status(404).json({ error: 'Desafio não encontrado' });
    res.json(desafio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// /participacoes
app.get('/participacoes', async (req, res) => {
  try {
    const { desafioId, usuarioId } = req.query;
    const filtro = {};
    if (desafioId) filtro.desafioId = desafioId;
    if (usuarioId) filtro.usuarioId = usuarioId;
    const participacoes = await Participacao.find(filtro);
    res.json(participacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// criar participação -> exige auth, associa usuario logado
app.post('/participacoes', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.desafioId || !body.postId) return res.status(400).json({ error: 'desafioId e postId são obrigatórios' });
    const novo = new Participacao({ ...body, usuarioId: req.user._id });
    await novo.save();
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/participacoes/:id', requireAuth, async (req, res) => {
  try {
    const part = await Participacao.findById(req.params.id);
    if (!part) return res.status(404).json({ error: 'Participação não encontrada' });

    if (String(part.usuarioId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await Participacao.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// /comentarios
app.get('/comentarios', async (req, res) => {
  try {
    const { postId, _sort, _order } = req.query;
    const filtro = {};
    if (postId) filtro.postId = postId;
    let query = Comentario.find(filtro);
    if (_sort === 'createdAt') {
      const ordem = _order === 'desc' ? -1 : 1;
      query = query.sort({ createdAt: ordem });
    }
    const comentarios = await query;
    res.json(comentarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// criar comentário -> exige auth, associa usuario logado
app.post('/comentarios', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.postId || !body.texto) return res.status(400).json({ error: 'postId e texto são obrigatórios' });
    const novo = new Comentario({ ...body, usuarioId: req.user._id, updatedAt: new Date() });
    await novo.save();
    res.status(201).json(novo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/comentarios/:id', requireAuth, async (req, res) => {
  try {
    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) return res.status(404).json({ error: 'Comentário não encontrado' });

    if (String(comentario.usuarioId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await Comentario.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// /seguidores
app.get('/seguidores', async (req, res) => {
  try {
    const { followerId, followingId } = req.query;
    const filtro = {};
    if (followerId) filtro.followerId = followerId;
    if (followingId) filtro.followingId = followingId;
    const seguidores = await Seguidor.find(filtro);
    res.json(seguidores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// criar follow -> exige auth (usuario logado é follower)
app.post('/seguidores', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const followerId = req.user._id;
    const followingId = body.followingId;
    if (!followingId) return res.status(400).json({ error: 'followingId é obrigatório' });

    const existe = await Seguidor.findOne({ followerId, followingId });
    if (existe) return res.status(409).json({ error: 'Relacionamento já existe' });

    const novo = new Seguidor({ followerId, followingId });
    await novo.save();
    res.status(201).json(novo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/seguidores/:id', requireAuth, async (req, res) => {
  try {
    const seguidor = await Seguidor.findById(req.params.id);
    if (!seguidor) return res.status(404).json({ error: 'Relação não encontrada' });

    if (String(seguidor.followerId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await Seguidor.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// /avaliacoes
app.get('/avaliacoes', async (req, res) => {
  try {
    const { postId } = req.query;
    const filtro = {};
    if (postId) filtro.postId = postId;
    const avaliacoes = await Avaliacao.find(filtro);
    res.json(avaliacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/avaliacoes/:id', async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findById(req.params.id);
    if (!avaliacao) return res.status(404).json({ error: 'Avaliação não encontrada' });
    res.json(avaliacao);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// criar avaliação -> exige auth (associa usuario logado)
app.post('/avaliacoes', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.postId) return res.status(400).json({ error: 'postId é obrigatório' });

    // evita dupla avaliação do mesmo usuário (pelo post)
    const existe = await Avaliacao.findOne({ postId: body.postId, usuarioId: req.user._id });
    if (existe) return res.status(409).json({ error: 'Avaliação já existe' });

    const nova = new Avaliacao({ ...body, usuarioId: req.user._id });
    await nova.save();
    res.status(201).json(nova);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/avaliacoes/:id', requireAuth, async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findById(req.params.id);
    if (!avaliacao) return res.status(404).json({ error: 'Avaliação não encontrada' });

    if (String(avaliacao.usuarioId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    Object.assign(avaliacao, req.body, { updatedAt: new Date() });
    await avaliacao.save();
    res.json(avaliacao);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/avaliacoes/:id', requireAuth, async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findById(req.params.id);
    if (!avaliacao) return res.status(404).json({ error: 'Avaliação não encontrada' });

    if (String(avaliacao.usuarioId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await Avaliacao.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
