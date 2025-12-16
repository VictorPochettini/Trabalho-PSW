// server.js (ES Modules) - Documentado com Swagger
// =====================================================
// API ArtBeat — Entry point da aplicação
// =====================================================

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { conectaDB } from './server/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Modelos
import Avaliacao from './models/Avaliacao.js';
import Comentario from './models/Comentario.js';
import Desafio from './models/Desafio.js';
import Participacao from './models/Participacao.js';
import Post from './models/Post.js';
import Seguidor from './models/Seguidor.js';
import Usuario from './models/Usuario.js';

// Auth
import './server/passport.js';
import authRoutes from './server/routes/auth.js';
import { requireAuth } from './server/middleware/auth.js';

// Conectar ao MongoDB
await conectaDB();

const app = express();

// Swagger
// import swaggerUi from 'swagger-ui-express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.js';

// Preparar diretórios de upload
['uploads/image', 'uploads/audio'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configuração Multer
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

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// Logging (dev)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Body:', req.body);
  next();
});

app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (data) {
    console.log('Response:', data);
    return originalSend.call(this, data);
  };
  next();
});

// Middlewares globais
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());
app.use(passport.initialize());
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// Rate limit
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth', authLimiter);

// =====================================================
// ROTAS
// =====================================================

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check da API
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: API está rodando
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: API ArtBeat rodando 🚀
 */
app.get('/', (req, res) => res.send('API ArtBeat rodando 🚀'));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Auth routes
app.use('/api/auth', authRoutes);

// =====================================================
// USUÁRIOS
// =====================================================

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Listar todos os usuários
 *     tags: [Usuarios]
 *     description: Retorna lista de usuários (sem dados sensíveis)
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       500:
 *         description: Erro interno do servidor
 */
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password -refreshTokens');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Buscar usuário por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         {description: Usuário não encontrado}
 */
app.get('/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password -refreshTokens');
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Criar usuário (DESABILITADO)
 *     tags: [Usuarios]
 *     description: Use POST /api/auth/register para criar usuários
 *     responses:
 *       405:
 *         description: Método não permitido
 */
app.post('/usuarios', (req, res) => {
  return res.status(405).json({
    error: 'Método não permitido. Para registrar use POST /api/auth/register'
  });
});

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Atualizar usuário inteiro (overwrite)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               bio:
 *                 type: string
 *               generosMusicais:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
app.put('/usuarios/:id', requireAuth, async (req, res) => {
  try {
    if (String(req.user._id) !== String(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const update = { ...req.body };
    delete update.refreshTokens;
    delete update.password;
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

/**
 * @swagger
 * /usuarios/{id}:
 *   patch:
 *     summary: Atualização parcial de usuário
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
app.patch('/usuarios/:id', requireAuth, async (req, res) => {
  try {
    if (String(req.user._id) !== String(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const update = { ...req.body };
    delete update.refreshTokens;
    delete update.password;
    const usuario = await Usuario.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password -refreshTokens');
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /usuarios/{id}/profile-photo:
 *   patch:
 *     summary: Atualizar foto de perfil
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto atualizada
 *       401:
 *         description: Não autorizado
 *       400:
 *         description: Nenhuma imagem enviada
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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

// =====================================================
// POSTS
// =====================================================

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Listar todos os posts
 *     tags: [Posts]
 *     description: Retorna posts com média e contagem de avaliações
 *     responses:
 *       200:
 *         description: Lista de posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Erro interno do servidor
 */
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    
    const postsWithRatings = await Promise.all(
      posts.map(async (post) => {
        const postObj = post.toObject();
        const avaliacoes = await Avaliacao.find({ postId: post._id });
        
        if (avaliacoes.length > 0) {
          const sum = avaliacoes.reduce((acc, av) => acc + Number(av.estrelas || 0), 0);
          postObj.ratingAvg = Number((sum / avaliacoes.length).toFixed(2));
          postObj.ratingCount = avaliacoes.length;
        } else {
          postObj.ratingAvg = 0;
          postObj.ratingCount = 0;
        }
        
        return postObj;
      })
    );
    
    res.json(postsWithRatings);
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Buscar post por ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
app.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });
    
    const postObj = post.toObject();
    const avaliacoes = await Avaliacao.find({ postId: post._id });
    
    if (avaliacoes.length > 0) {
      const sum = avaliacoes.reduce((acc, av) => acc + Number(av.estrelas || 0), 0);
      postObj.ratingAvg = Number((sum / avaliacoes.length).toFixed(2));
      postObj.ratingCount = avaliacoes.length;
    } else {
      postObj.ratingAvg = 0;
      postObj.ratingCount = 0;
    }
    
    res.json(postObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Criar novo post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               conteudo:
 *                 type: string
 *               tipo:
 *                 type: string
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post criado
 *       500:
 *         description: Erro interno
 */
app.post('/posts', requireAuth, upload.single('media'), async (req, res) => {
  try {
    const postData = {
      ...req.body,
      usuarioId: req.user._id
    };
    
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

/**
 * @swagger
 * /posts/{id}:
 *   patch:
 *     summary: Atualizar post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               conteudo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post atualizado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Post não encontrado
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
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

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Deletar post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Post deletado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Post não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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

/**
 * @swagger
 * /desafios:
 *   get:
 *     summary: Listar todos os desafios
 *     tags: [Desafios]
 *     responses:
 *       200:
 *         description: Lista de desafios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Desafio'
 *       500:
 *         description: Erro interno do servidor
 */
app.get('/desafios', async (req, res) => {
  try {
    const desafio = await Desafio.find();
    res.json(desafio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /desafios/{id}:
 *   get:
 *     summary: Buscar desafio por ID
 *     tags: [Desafios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Desafio encontrado
 *       404:
 *         description: Desafio não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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

// server.js - PATCH para rota POST /desafios

// Substituir a rota existente (linha ~367):
/*
app.post('/desafios', requireAuth, async (req, res) => {
  try {
    const novo = new Desafio({ ...req.body, createdBy: req.user._id });
    await novo.save();
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/

// ✅ NOVA IMPLEMENTAÇÃO:

/**
* @swagger
* /desafios:
*   post:
*     summary: Criar desafio
*     tags: [Desafios]
*     security:
*       - bearerAuth: []
*     responses:
*       201:
*         description: Desafio criado
*/
app.post('/desafios', requireAuth, async (req, res) => {
  try {
    console.log('📥 Recebendo requisição para criar desafio');
    console.log('📦 Body recebido:', req.body);
    
    // ✅ Normalizar tipoAceito e tiposPermitidos
    let tipoAceito = req.body.tipoAceito || req.body.tiposPermitidos || [];
    
    // Garantir que é array
    if (!Array.isArray(tipoAceito)) {
      tipoAceito = [tipoAceito];
    }
    
    // Filtrar valores vazios e normalizar para lowercase
    tipoAceito = tipoAceito
      .filter(t => t && typeof t === 'string')
      .map(t => t.toLowerCase().trim());
    
    // Se array vazio, usar todos os tipos
    if (tipoAceito.length === 0) {
      tipoAceito = ['musica', 'visual', 'texto'];
    }
    
    console.log('✅ tipoAceito normalizado:', tipoAceito);
    
    // Criar objeto do desafio
    const desafioData = {
      ...req.body,
      tipoAceito,           // ✅ Campo principal
      tiposPermitidos: tipoAceito, // ✅ Compatibilidade
      createdBy: req.user._id
    };
    
    console.log('💾 Criando desafio:', desafioData);
    
    const novo = new Desafio(desafioData);
    await novo.save();
    
    console.log('✅ Desafio criado com sucesso:', novo._id);
    console.log('   tipoAceito:', novo.tipoAceito);
    console.log('   tiposPermitidos:', novo.tiposPermitidos);
    
    res.status(201).json(novo);
  } catch (error) {
    console.error('❌ Erro ao criar desafio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
* @swagger
* /desafios/{id}:
*   delete:
*     summary: Excluir desafio
*     tags: [Desafios]
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: string
*     responses:
*       200:
*         description: Desafio excluído
*       403:
*         description: Sem permissão
*       404:
*         description: Desafio não encontrado
*/
// DELETE /desafios/:id - Excluir desafio (apenas criador ou admin)
app.delete('/desafios/:id', requireAuth, async (req, res) => {
  try {
    const desafio = await Desafio.findById(req.params.id);
    if (!desafio) return res.status(404).json({ error: 'Desafio não encontrado' });
    
    // Verifica se o usuário é o criador ou admin
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role || req.user.tipo;
    const isCreator = String(desafio.criadorId) === String(userId);
    const isAdmin = userRole === 'admin' || userRole === 'ADMIN';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Sem permissão para excluir este desafio' });
    }
    
    // Remove o desafio
    await Desafio.findByIdAndDelete(req.params.id);
    
    // Opcional: também remover participações relacionadas
    await Participacao.deleteMany({ desafioId: req.params.id });
    
    res.json({ message: 'Desafio excluído com sucesso', id: req.params.id });
  } catch (error) {
    console.error('Erro ao excluir desafio:', error);
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// /participacoes

/**
 * @swagger
 * /participacoes:
 *   get:
 *     summary: Listar participações
 *     tags: [Participacoes]
 *     parameters:
 *       - in: query
 *         name: desafioId
 *         schema:
 *           type: string
 *       - in: query
 *         name: usuarioId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de participações
 *       500:
 *         description: Erro interno do servidor
 */

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
// PATCH PARA server.js - Seção de participações
// Substitua a rota POST /participacoes no seu server.js (linha ~432)

// criar participação -> exige auth, associa usuario logado

/**
* @swagger
* /participacoes:
*   post:
*     summary: Criar participação
*     tags: [Participacoes]
*     security:
*       - bearerAuth: []
*     responses:
*       201:
*         description: Participação criada
*/
app.post('/participacoes', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.desafioId || !body.postId) {
      return res.status(400).json({ error: 'desafioId e postId são obrigatórios' });
    }

    // ✅ CORREÇÃO 4: Validar que o post foi criado DEPOIS da data de início do desafio
    const desafio = await Desafio.findById(body.desafioId);
    if (!desafio) {
      return res.status(404).json({ error: 'Desafio não encontrado' });
    }

    const post = await Post.findById(body.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }

    // Verificar se o post foi criado após a data de início do desafio
    if (desafio.dataInicio) {
      const dataInicioDesafio = new Date(desafio.dataInicio);
      const dataPost = new Date(post.createdAt || post.dataPublicacao);

      if (dataPost < dataInicioDesafio) {
        return res.status(400).json({ 
          error: 'Este post foi criado antes do início do desafio e não pode ser submetido',
          dataPost: dataPost.toISOString(),
          dataInicioDesafio: dataInicioDesafio.toISOString()
        });
      }
    }

    // Verificar se já existe uma participação com este post
    const existente = await Participacao.findOne({ 
      desafioId: body.desafioId, 
      postId: body.postId 
    });

    if (existente) {
      return res.status(409).json({ error: 'Este post já foi submetido a este desafio' });
    }

    const novo = new Participacao({ ...body, usuarioId: req.user._id });
    await novo.save();
    
    console.log('✅ Participação criada:', novo);
    res.status(201).json(novo);
  } catch (error) {
    console.error('❌ Erro ao criar participação:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
* @swagger
* /participacoes/{id}:
*   delete:
*     summary: Remover participação
*     tags: [Participacoes]
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: string
*     responses:
*       204:
*         description: Participação removida
*/
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

/**
* @swagger
* /comentarios:
*   get:
*     summary: Listar comentários
*     tags: [Comentarios]
*     responses:
*       200:
*         description: Lista de comentários
*/
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

/**
* @swagger
* /comentarios/{id}:
*   get:
*     summary: Buscar comentário por ID
*     tags: [Comentarios]
*/
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
/**
* @swagger
* /comentarios/{id}/respostas:
*   get:
*     summary: Listar respostas de um comentário
*     tags: [Comentarios]
*/
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
/**
* @swagger
* /comentarios:
*   post:
*     summary: Criar comentário
*     tags: [Comentarios]
*     security:
*       - bearerAuth: []
*/
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
/**
* @swagger
* /comentarios/{id}:
*   patch:
*     summary: Atualizar comentário (texto ou likes)
*     tags: [Comentarios]
*     security:
*       - bearerAuth: []
*/
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
/**
* @swagger
* /comentarios/{id}/like:
*   post:
*     summary: Dar like em comentário
*     tags: [Comentarios]
*     security:
*       - bearerAuth: []
*/
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
/**
* @swagger
* /comentarios/{id}:
*   delete:
*     summary: Deletar comentário (soft delete)
*     tags: [Comentarios]
*     security:
*       - bearerAuth: []
*/
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
/**
* @swagger
* /comentarios/{id}/permanent:
*   delete:
*     summary: Deletar comentário permanentemente
*     tags: [Comentarios]
*     security:
*       - bearerAuth: []
*/
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
/**
* @swagger
* /comentarios/count/{postId}:
*   get:
*     summary: Contar comentários de um post
*     tags: [Comentarios]
*/
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
/**
* @swagger
* /seguidores:
*   get:
*     summary: Listar seguidores
*     tags: [Seguidores]
*/
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
/**
* @swagger
* /seguidores:
*   post:
*     summary: Seguir usuário
*     tags: [Seguidores]
*     security:
*       - bearerAuth: []
*/
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

/**
* @swagger
* /seguidores/{id}:
*   delete:
*     summary: Deixar de seguir
*     tags: [Seguidores]
*     security:
*       - bearerAuth: []
*/
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

// ✅ VERIFICAR SE ESTÁ SEGUINDO
/**
 * @swagger
 * /follows/is-following:
 *   get:
 *     summary: Verificar se está seguindo
 *     tags: [Seguidores]
 *     parameters:
 *       - in: query
 *         name: followerId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: followingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Status de seguimento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFollowing: { type: boolean }
 *       400: { description: followerId e followingId são obrigatórios }
 *       500: { description: Erro interno }
 */
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
/**
* @swagger
* /follows/counts/{userId}:
*   get:
*     summary: Contagem de seguidores e seguindo
*     tags: [Follows]
*/
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
/**
* @swagger
* /follows/followers/{userId}:
*   get:
*     summary: Listar seguidores de um usuário
*     tags: [Follows]
*/
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
/**
* @swagger
* /follows/following/{userId}:
*   get:
*     summary: Listar quem o usuário segue
*     tags: [Follows]
*/
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
/**
* @swagger
* /follows:
*   post:
*     summary: Criar follow
*     tags: [Follows]
*     security:
*       - bearerAuth: []
*/
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
/**
* @swagger
* /follows:
*   delete:
*     summary: Remover follow
*     tags: [Follows]
*     security:
*       - bearerAuth: []
*/
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

/**
* @swagger
* /avaliacoes:
*   get:
*     summary: Listar avaliações
*     tags: [Avaliacoes]
*/
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

/**
* @swagger
* /avaliacoes/user/{usuarioId}/post/{postId}:
*   get:
*     summary: Buscar avaliação de usuário em post
*     tags: [Avaliacoes]
*/
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

/**
* @swagger
* /avaliacoes/stats/{postId}:
*   get:
*     summary: Estatísticas de avaliações de um post
*     tags: [Avaliacoes]
*/
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

/**
* @swagger
* /avaliacoes/{id}:
*   get:
*     summary: Buscar avaliação por ID
*     tags: [Avaliacoes]
*/
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

/**
* @swagger
* /avaliacoes:
*   post:
*     summary: Criar ou atualizar avaliação
*     tags: [Avaliacoes]
*     security:
*       - bearerAuth: []
*/
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
/**
* @swagger
* /avaliacoes/{id}:
*   patch:
*     summary: Atualizar avaliação
*     tags: [Avaliacoes]
*     security:
*       - bearerAuth: []
*/
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
/**
* @swagger
* /avaliacoes/{id}:
*   delete:
*     summary: Deletar avaliação
*     tags: [Avaliacoes]
*     security:
*       - bearerAuth: []
*/
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
/**
* @swagger
* /avaliacoes/user/{usuarioId}/post/{postId}:
*   delete:
*     summary: Deletar avaliação por usuário e post
*     tags: [Avaliacoes]
*     security:
*       - bearerAuth: []
*/
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