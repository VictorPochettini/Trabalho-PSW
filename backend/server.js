// server.js (ES modules) - adaptado para Opção B (registro via /api/auth/register)
import dotenv from 'dotenv';
dotenv.config(); // carregue .env apenas uma vez, no entrypoint

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import mongoose from 'mongoose';
import { conectaDB } from './server/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

['uploads/image', 'uploads/audio'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isAudio = file.mimetype.startsWith('audio/');
    
    if (isImage) cb(null, 'uploads/image/');
    else if (isAudio) cb(null, 'uploads/audio/');
    else cb(new Error('Tipo de arquivo não suportado'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedAudio = /mp3|wav|ogg|m4a|mpeg/;
  
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const isImage = file.mimetype.startsWith('image/') && allowedImages.test(ext);
  const isAudio = file.mimetype.startsWith('audio/') && allowedAudio.test(ext);
  
  (isImage || isAudio) ? cb(null, true) : cb(new Error('Tipo não suportado'));
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Body:', req.body);
  next();
});

app.use((req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    console.log('Response:', data);
    return originalSend.call(this, data);
  };
  
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

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

// ADICIONAR depois da seção de usuários
app.patch('/usuarios/:id/profile-photo', requireAuth, upload.single('profilePhoto'), async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user._id;
    
    if (String(userId) !== String(requestingUserId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }
    
    let normalizedPath = req.file.path.replace(/\\/g, '/');

    normalizedPath = "http://localhost:5000/"+normalizedPath;
    
    const usuario = await Usuario.findByIdAndUpdate(
      userId,
      { fotoPerfil: normalizedPath },
      { new: true }
    ).select('-password -refreshTokens');
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({
      message: 'Foto de perfil atualizada com sucesso',
      fotoPerfil: normalizedPath,
      usuario
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
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
app.post('/posts', requireAuth, upload.single('media'), async (req, res) => {
  try {
    const postData = {
      ...req.body,
      usuarioId: req.user._id
    };
    
    // Se houver arquivo, adicionar caminho e tipo
    if (req.file) {
      postData.mediaPath = req.file.path;
      postData.mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'audio';
    }
    
    const novo = new Post(postData);
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
// -----------------------------
// /comentarios
// GET - Listar comentários (com filtros e ordenação)
app.get('/comentarios', async (req, res) => {
  try {
    const { postId, usuarioId, parentId, _sort, _order, includeDeleted } = req.query;
    const filtro = {};
    
    if (postId) filtro.postId = postId;
    if (usuarioId) filtro.usuarioId = usuarioId;
    if (parentId !== undefined) {
      filtro.parentId = parentId === 'null' ? null : parentId;
    }
    
    // Por padrão, não retornar comentários deletados
    if (!includeDeleted || includeDeleted === 'false') {
      filtro.deletedAt = null;
    }
    
    let query = Comentario.find(filtro);
    
    // Ordenação
    if (_sort === 'createdAt') {
      const ordem = _order === 'desc' ? -1 : 1;
      query = query.sort({ createdAt: ordem });
    } else if (_sort === 'likes') {
      const ordem = _order === 'desc' ? -1 : 1;
      query = query.sort({ likes: ordem });
    } else {
      query = query.sort({ createdAt: -1 }); // Default: mais recentes primeiro
    }
    
    const comentarios = await query;
    
    console.log(`✅ Encontrados ${comentarios.length} comentários`, {
      postId,
      usuarioId,
      parentId
    });
    
    res.json(comentarios);
  } catch (error) {
    console.error('❌ Erro ao buscar comentários:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Buscar comentário específico por ID
app.get('/comentarios/:id', async (req, res) => {
  try {
    const comentario = await Comentario.findById(req.params.id);
    
    if (!comentario) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }
    
    res.json(comentario);
  } catch (error) {
    console.error('❌ Erro ao buscar comentário:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Buscar respostas de um comentário (comentários aninhados)
app.get('/comentarios/:id/respostas', async (req, res) => {
  try {
    const respostas = await Comentario.find({
      parentId: req.params.id,
      deletedAt: null
    }).sort({ createdAt: 1 });
    
    res.json(respostas);
  } catch (error) {
    console.error('❌ Erro ao buscar respostas:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Criar novo comentário
app.post('/comentarios', requireAuth, async (req, res) => {
  try {
    const { postId, texto, parentId } = req.body;
    const usuarioId = req.user._id;
    
    if (!postId || !texto) {
      return res.status(400).json({ error: 'postId e texto são obrigatórios' });
    }
    
    // Validar se o post existe
    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }
    
    // Se for resposta, validar se o comentário pai existe
    if (parentId) {
      const parentExists = await Comentario.findById(parentId);
      if (!parentExists) {
        return res.status(404).json({ error: 'Comentário pai não encontrado' });
      }
    }
    
    const novo = new Comentario({ 
      postId, 
      usuarioId, 
      texto: texto.trim(),
      parentId: parentId || null,
      likes: 0,
      updatedAt: new Date() 
    });
    
    await novo.save();
    
    console.log('✅ Comentário criado:', {
      id: novo._id,
      postId: novo.postId,
      usuarioId: novo.usuarioId,
      parentId: novo.parentId
    });
    
    res.status(201).json(novo);
  } catch (error) {
    console.error('❌ Erro ao criar comentário:', error);
    res.status(400).json({ error: error.message });
  }
});

// PATCH - Atualizar comentário (texto ou likes)
app.patch('/comentarios/:id', requireAuth, async (req, res) => {
  try {
    const comentario = await Comentario.findById(req.params.id);
    
    if (!comentario) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }
    
    // Verificar se foi deletado
    if (comentario.deletedAt) {
      return res.status(410).json({ error: 'Comentário foi deletado' });
    }
    
    // Verificar ownership para editar texto
    if (req.body.texto) {
      if (String(comentario.usuarioId) !== String(req.user._id) && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      comentario.texto = req.body.texto.trim();
    }
    
    // Qualquer um pode dar like (se implementar sistema de likes)
    if (req.body.likes !== undefined) {
      comentario.likes = Number(req.body.likes);
    }
    
    comentario.updatedAt = new Date();
    await comentario.save();
    
    console.log('✅ Comentário atualizado:', comentario._id);
    res.json(comentario);
  } catch (error) {
    console.error('❌ Erro ao atualizar comentário:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST - Dar like em comentário
app.post('/comentarios/:id/like', requireAuth, async (req, res) => {
  try {
    const comentario = await Comentario.findById(req.params.id);
    
    if (!comentario) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }
    
    if (comentario.deletedAt) {
      return res.status(410).json({ error: 'Comentário foi deletado' });
    }
    
    comentario.likes = (comentario.likes || 0) + 1;
    comentario.updatedAt = new Date();
    await comentario.save();
    
    console.log('✅ Like adicionado ao comentário:', comentario._id);
    res.json({ likes: comentario.likes });
  } catch (error) {
    console.error('❌ Erro ao dar like:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Soft delete (marca como deletado)
app.delete('/comentarios/:id', requireAuth, async (req, res) => {
  try {
    const comentario = await Comentario.findById(req.params.id);
    
    if (!comentario) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }
    
    // Verificar ownership
    if (String(comentario.usuarioId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Soft delete: marca data de deleção em vez de deletar
    comentario.deletedAt = new Date();
    comentario.updatedAt = new Date();
    await comentario.save();
    
    console.log('✅ Comentário marcado como deletado:', comentario._id);
    res.status(204).end();
  } catch (error) {
    console.error('❌ Erro ao deletar comentário:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Hard delete (remove permanentemente) - apenas admin
app.delete('/comentarios/:id/permanent', requireAuth, async (req, res) => {
  try {
    // Apenas admin pode fazer hard delete
    if (req.user.role !== 'admin' && req.user.admin !== true) {
      return res.status(403).json({ error: 'Apenas administradores podem deletar permanentemente' });
    }
    
    const comentario = await Comentario.findById(req.params.id);
    
    if (!comentario) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }
    
    // Deletar também todas as respostas deste comentário
    await Comentario.deleteMany({ parentId: req.params.id });
    
    // Deletar o comentário
    await Comentario.findByIdAndDelete(req.params.id);
    
    console.log('✅ Comentário deletado permanentemente:', req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('❌ Erro ao deletar comentário permanentemente:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Contar comentários de um post
app.get('/comentarios/count/:postId', async (req, res) => {
  try {
    const count = await Comentario.countDocuments({
      postId: req.params.postId,
      deletedAt: null
    });
    
    res.json({ count });
  } catch (error) {
    console.error('❌ Erro ao contar comentários:', error);
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

// Adicione estas rotas APÓS a seção /seguidores no seu server.js

// -----------------------------
// /follows (alias para /seguidores com endpoints extras)
// -----------------------------

// ✅ VERIFICAR SE ESTÁ SEGUINDO
app.get('/follows/is-following', async (req, res) => {
  try {
    const { followerId, followingId } = req.query;

    if (!followerId || !followingId) {
      return res.status(400).json({ message: 'followerId e followingId são obrigatórios' });
    }

    const follow = await Seguidor.findOne({
      followerId: String(followerId),
      followingId: String(followingId)
    });

    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('❌ Erro ao verificar seguimento:', error);
    res.status(500).json({ message: 'Erro ao verificar seguimento', error: error.message });
  }
});

// ✅ BUSCAR CONTAGENS (seguidores + seguindo)
app.get('/follows/counts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório' });
    }

    // Conta quantas pessoas seguem este usuário (seguidores)
    const followersCount = await Seguidor.countDocuments({
      followingId: String(userId)
    });

    // Conta quantas pessoas este usuário segue (seguindo)
    const followingCount = await Seguidor.countDocuments({
      followerId: String(userId)
    });

    console.log(`✅ Contagens para userId ${userId}:`, { followersCount, followingCount });

    res.json({ 
      followersCount, 
      followingCount 
    });
  } catch (error) {
    console.error('❌ Erro ao buscar contagens:', error);
    res.status(500).json({ message: 'Erro ao buscar contagens', error: error.message });
  }
});

// ✅ BUSCAR LISTA DE SEGUIDORES (quem segue o usuário)
app.get('/follows/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório' });
    }

    // Busca todos os follows onde followingId = userId
    const follows = await Seguidor.find({
      followingId: String(userId)
    });

    console.log(`✅ Encontrados ${follows.length} seguidores para userId ${userId}`);
    console.log('Follows encontrados:', follows);

    // Extrai os IDs dos seguidores
    const followerIds = follows.map(f => f.followerId);
    
    console.log('IDs dos seguidores:', followerIds);

    // Busca os dados dos usuários seguidores
    const followers = await Usuario.find({
      _id: { $in: followerIds }
    }).select('_id username nome fotoPerfil');

    console.log(`✅ Dados dos ${followers.length} seguidores:`, followers);

    res.json({ followers });
  } catch (error) {
    console.error('❌ Erro ao buscar seguidores:', error);
    res.status(500).json({ message: 'Erro ao buscar seguidores', error: error.message });
  }
});

// ✅ BUSCAR LISTA DE SEGUINDO (quem o usuário segue)
app.get('/follows/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório' });
    }

    // Busca todos os follows onde followerId = userId
    const follows = await Seguidor.find({
      followerId: String(userId)
    });

    console.log(`✅ Encontrados ${follows.length} seguindo para userId ${userId}`);

    // Extrai os IDs de quem está sendo seguido
    const followingIds = follows.map(f => f.followingId);

    // Busca os dados dos usuários que estão sendo seguidos
    const following = await Usuario.find({
      _id: { $in: followingIds }
    }).select('_id username nome fotoPerfil');

    console.log(`✅ Dados de quem está seguindo:`, following);

    res.json({ following });
  } catch (error) {
    console.error('❌ Erro ao buscar seguindo:', error);
    res.status(500).json({ message: 'Erro ao buscar seguindo', error: error.message });
  }
});

// ✅ CRIAR FOLLOW (POST /follows)
app.post('/follows', requireAuth, async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({ message: 'followerId e followingId são obrigatórios' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ message: 'Usuário não pode seguir a si mesmo' });
    }

    // Verifica se já segue
    const existingFollow = await Seguidor.findOne({
      followerId: String(followerId),
      followingId: String(followingId)
    });

    if (existingFollow) {
      return res.status(400).json({ message: 'Já está seguindo este usuário' });
    }

    // Cria novo follow
    const newFollow = new Seguidor({
      followerId: String(followerId),
      followingId: String(followingId),
      createdAt: Date.now()
    });

    await newFollow.save();
    console.log('✅ Follow criado:', newFollow);
    res.status(201).json({ message: 'Seguindo com sucesso', follow: newFollow });
  } catch (error) {
    console.error('❌ Erro ao seguir:', error);
    res.status(500).json({ message: 'Erro ao seguir usuário', error: error.message });
  }
});

// ✅ REMOVER FOLLOW (DELETE /follows)
app.delete('/follows', requireAuth, async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({ message: 'followerId e followingId são obrigatórios' });
    }

    const result = await Seguidor.findOneAndDelete({
      followerId: String(followerId),
      followingId: String(followingId)
    });

    if (!result) {
      return res.status(404).json({ message: 'Relação de seguimento não encontrada' });
    }

    console.log('✅ Follow removido:', result);
    res.json({ message: 'Deixou de seguir com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deixar de seguir:', error);
    res.status(500).json({ message: 'Erro ao deixar de seguir', error: error.message });
  }
});

// -----------------------------
// /avaliacoes
// -----------------------------
// /avaliacoes
// Buscar todas as avaliações (com filtros opcionais)
app.get('/avaliacoes', async (req, res) => {
  try {
    const { postId, usuarioId } = req.query;
    const filtro = {};
    
    if (postId) filtro.postId = postId;
    if (usuarioId) filtro.usuarioId = usuarioId;
    
    const avaliacoes = await Avaliacao.find(filtro);
    res.json(avaliacoes);
  } catch (error) {
    console.error('❌ Erro ao buscar avaliações:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ NOVO: Buscar avaliação de um usuário específico em um post
app.get('/avaliacoes/user/:usuarioId/post/:postId', async (req, res) => {
  try {
    const { usuarioId, postId } = req.params;
    
    const avaliacao = await Avaliacao.findOne({ 
      postId: postId, 
      usuarioId: usuarioId 
    });
    
    if (!avaliacao) {
      return res.json({ estrelas: 0, exists: false });
    }
    
    res.json({ 
      estrelas: avaliacao.estrelas, 
      exists: true,
      _id: avaliacao._id,
      createdAt: avaliacao.createdAt,
      updatedAt: avaliacao.updatedAt
    });
  } catch (error) {
    console.error('❌ Erro ao buscar avaliação do usuário:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ NOVO: Buscar estatísticas de avaliações de um post (média e contagem)
// ❌ DELETAR código com aggregate
// ✅ SUBSTITUIR por:

app.get('/avaliacoes/stats/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    console.log('📊 [Stats] Buscando avaliações para postId:', postId);
    
    const avaliacoes = await Avaliacao.find({ postId: String(postId) });
    
    console.log('✅ [Stats] Avaliações encontradas:', avaliacoes.length);
    
    if (!avaliacoes || avaliacoes.length === 0) {
      return res.json({ average: 0, count: 0 });
    }
    
    const soma = avaliacoes.reduce((acc, av) => acc + Number(av.estrelas || 0), 0);
    const media = soma / avaliacoes.length;
    
    res.json({
      average: Number(media.toFixed(2)),
      count: avaliacoes.length
    });
  } catch (error) {
    console.error('❌ [Stats] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar avaliação específica por ID
app.get('/avaliacoes/:id', async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findById(req.params.id);
    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }
    res.json(avaliacao);
  } catch (error) {
    console.error('❌ Erro ao buscar avaliação:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar ou atualizar avaliação (upsert)
app.post('/avaliacoes', requireAuth, async (req, res) => {
  try {
    const { postId, estrelas } = req.body;
    const usuarioId = req.user._id;
    
    if (!postId) {
      return res.status(400).json({ error: 'postId é obrigatório' });
    }
    
    if (!estrelas || estrelas < 1 || estrelas > 5) {
      return res.status(400).json({ error: 'estrelas deve ser entre 1 e 5' });
    }
    
    // Usar findOneAndUpdate com upsert para criar ou atualizar
    const avaliacao = await Avaliacao.findOneAndUpdate(
      {
        postId: String(postId),      // ← Converter para String
        usuarioId: String(usuarioId) // ← Converter para String

      },
      { 
        estrelas: Number(estrelas),
        updatedAt: new Date()
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    console.log('✅ Avaliação salva:', avaliacao);
    res.status(200).json(avaliacao);
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar avaliação:', error);
    
    // Se for erro de duplicação (code 11000), tenta atualizar
    if (error.code === 11000) {
      try {
        const { postId, estrelas } = req.body;
        const usuarioId = req.user._id;
        
        const updated = await Avaliacao.findOneAndUpdate(
          { postId, usuarioId },
          { estrelas: Number(estrelas), updatedAt: new Date() },
          { new: true }
        );
        
        return res.status(200).json(updated);
      } catch (updateError) {
        return res.status(500).json({ error: updateError.message });
      }
    }
    
    res.status(400).json({ error: error.message });
  }
});

// Atualizar avaliação existente
app.patch('/avaliacoes/:id', requireAuth, async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findById(req.params.id);
    
    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }
    
    // Verificar ownership
    if (String(avaliacao.usuarioId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (req.body.estrelas) {
      const estrelas = Number(req.body.estrelas);
      if (estrelas < 1 || estrelas > 5) {
        return res.status(400).json({ error: 'estrelas deve ser entre 1 e 5' });
      }
      avaliacao.estrelas = estrelas;
    }
    
    avaliacao.updatedAt = new Date();
    await avaliacao.save();
    
    console.log('✅ Avaliação atualizada:', avaliacao);
    res.json(avaliacao);
  } catch (error) {
    console.error('❌ Erro ao atualizar avaliação:', error);
    res.status(400).json({ error: error.message });
  }
});

// Deletar avaliação
app.delete('/avaliacoes/:id', requireAuth, async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findById(req.params.id);
    
    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }
    
    // Verificar ownership
    if (String(avaliacao.usuarioId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    await Avaliacao.findByIdAndDelete(req.params.id);
    
    console.log('✅ Avaliação deletada');
    res.status(204).end();
  } catch (error) {
    console.error('❌ Erro ao deletar avaliação:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ NOVO: Deletar avaliação por postId e usuarioId
app.delete('/avaliacoes/user/:usuarioId/post/:postId', requireAuth, async (req, res) => {
  try {
    const { usuarioId, postId } = req.params;
    
    // Verificar ownership
    if (String(usuarioId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const result = await Avaliacao.findOneAndDelete({ 
      postId, 
      usuarioId 
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }
    
    console.log('✅ Avaliação removida');
    res.status(204).end();
  } catch (error) {
    console.error('❌ Erro ao remover avaliação:', error);
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
