// backend/routes/follows.js
import express from 'express';
import Seguidor from '../models/Seguidor.js';
import Usuario from '../models/Usuario.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Follows
 *   description: Sistema de seguir e deixar de seguir usuários
 */

/**
 * @swagger
 * /api/follows:
 *   post:
 *     summary: Seguir um usuário
 *     tags: [Follows]
 *     description: Cria uma relação de seguimento entre dois usuários.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - followerId
 *               - followingId
 *             properties:
 *               followerId:
 *                 type: string
 *                 example: 64f1c9a12c9b1c0012a12345
 *               followingId:
 *                 type: string
 *                 example: 64f1c9a12c9b1c0012a67890
 *     responses:
 *       201:
 *         description: Usuário seguido com sucesso
 *       400:
 *         description: Dados inválidos ou relação já existente
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res
        .status(400)
        .json({ message: 'followerId e followingId são obrigatórios' });
    }

    if (followerId === followingId) {
      return res
        .status(400)
        .json({ message: 'Usuário não pode seguir a si mesmo' });
    }

    const existingFollow = await Seguidor.findOne({
      followerId: String(followerId),
      followingId: String(followingId),
    });

    if (existingFollow) {
      return res
        .status(400)
        .json({ message: 'Já está seguindo este usuário' });
    }

    const newFollow = new Seguidor({
      followerId: String(followerId),
      followingId: String(followingId),
      createdAt: Date.now(),
    });

    await newFollow.save();

    res.status(201).json({
      message: 'Seguindo com sucesso',
      follow: newFollow,
    });
  } catch (error) {
    console.error('Erro ao seguir:', error);
    res.status(500).json({
      message: 'Erro ao seguir usuário',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/follows:
 *   delete:
 *     summary: Deixar de seguir um usuário
 *     tags: [Follows]
 *     description: Remove a relação de seguimento entre dois usuários.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - followerId
 *               - followingId
 *             properties:
 *               followerId:
 *                 type: string
 *               followingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deixou de seguir com sucesso
 *       404:
 *         description: Relação de seguimento não encontrada
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/', async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res
        .status(400)
        .json({ message: 'followerId e followingId são obrigatórios' });
    }

    const result = await Seguidor.findOneAndDelete({
      followerId: String(followerId),
      followingId: String(followingId),
    });

    if (!result) {
      return res
        .status(404)
        .json({ message: 'Relação de seguimento não encontrada' });
    }

    res.json({ message: 'Deixou de seguir com sucesso' });
  } catch (error) {
    console.error('Erro ao deixar de seguir:', error);
    res.status(500).json({
      message: 'Erro ao deixar de seguir',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/follows/is-following:
 *   get:
 *     summary: Verificar se um usuário segue outro
 *     tags: [Follows]
 *     description: Retorna se um usuário está seguindo outro.
 *     parameters:
 *       - in: query
 *         name: followerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: followingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado da verificação
 *       400:
 *         description: Parâmetros ausentes
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/is-following', async (req, res) => {
  try {
    const { followerId, followingId } = req.query;

    if (!followerId || !followingId) {
      return res
        .status(400)
        .json({ message: 'followerId e followingId são obrigatórios' });
    }

    const follow = await Seguidor.findOne({
      followerId: String(followerId),
      followingId: String(followingId),
    });

    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Erro ao verificar seguimento:', error);
    res.status(500).json({
      message: 'Erro ao verificar seguimento',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/follows/counts/{userId}:
 *   get:
 *     summary: Obter contagem de seguidores e seguindo
 *     tags: [Follows]
 *     description: Retorna a quantidade de seguidores e de usuários seguidos.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contagens retornadas com sucesso
 *       400:
 *         description: userId ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/counts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório' });
    }

    const followersCount = await Seguidor.countDocuments({
      followingId: String(userId),
    });

    const followingCount = await Seguidor.countDocuments({
      followerId: String(userId),
    });

    res.json({ followersCount, followingCount });
  } catch (error) {
    console.error('Erro ao buscar contagens:', error);
    res.status(500).json({
      message: 'Erro ao buscar contagens',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/follows/followers/{userId}:
 *   get:
 *     summary: Listar seguidores de um usuário
 *     tags: [Follows]
 *     description: Retorna os usuários que seguem o usuário informado.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de seguidores
 *       400:
 *         description: userId ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório' });
    }

    const follows = await Seguidor.find({
      followingId: String(userId),
    });

    const followerIds = follows.map((f) => f.followerId);

    const followers = await Usuario.find({
      _id: { $in: followerIds },
    }).select('_id username nome fotoPerfil');

    res.json({ followers });
  } catch (error) {
    console.error('Erro ao buscar seguidores:', error);
    res.status(500).json({
      message: 'Erro ao buscar seguidores',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/follows/following/{userId}:
 *   get:
 *     summary: Listar usuários que um usuário segue
 *     tags: [Follows]
 *     description: Retorna os usuários que o usuário informado está seguindo.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de usuários seguidos
 *       400:
 *         description: userId ausente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório' });
    }

    const follows = await Seguidor.find({
      followerId: String(userId),
    });

    const followingIds = follows.map((f) => f.followingId);

    const following = await Usuario.find({
      _id: { $in: followingIds },
    }).select('_id username nome fotoPerfil');

    res.json({ following });
  } catch (error) {
    console.error('Erro ao buscar seguindo:', error);
    res.status(500).json({
      message: 'Erro ao buscar seguindo',
      error: error.message,
    });
  }
});

export default router;
