// backend/routes/follows.js
import express from 'express';
import Seguidor from '../models/Seguidor.js';
import Usuario from '../models/Usuario.js'; // Ajuste o nome do modelo conforme seu projeto

const router = express.Router();

// ✅ CRIAR FOLLOW
router.post('/', async (req, res) => {
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
    res.status(201).json({ message: 'Seguindo com sucesso', follow: newFollow });
  } catch (error) {
    console.error('Erro ao seguir:', error);
    res.status(500).json({ message: 'Erro ao seguir usuário', error: error.message });
  }
});

// ✅ REMOVER FOLLOW
router.delete('/', async (req, res) => {
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

    res.json({ message: 'Deixou de seguir com sucesso' });
  } catch (error) {
    console.error('Erro ao deixar de seguir:', error);
    res.status(500).json({ message: 'Erro ao deixar de seguir', error: error.message });
  }
});

// ✅ VERIFICAR SE ESTÁ SEGUINDO
router.get('/is-following', async (req, res) => {
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
    console.error('Erro ao verificar seguimento:', error);
    res.status(500).json({ message: 'Erro ao verificar seguimento', error: error.message });
  }
});

// ✅ BUSCAR CONTAGENS (seguidores + seguindo)
router.get('/counts/:userId', async (req, res) => {
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

    console.log(`✅ Contagens para ${userId}:`, { followersCount, followingCount });

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
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório' });
    }

    // Busca todos os follows onde followingId = userId
    const follows = await Seguidor.find({
      followingId: String(userId)
    });

    console.log(`✅ Encontrados ${follows.length} seguidores para ${userId}`);

    // Extrai os IDs dos seguidores
    const followerIds = follows.map(f => f.followerId);

    // Busca os dados dos usuários seguidores
    const followers = await Usuario.find({
      _id: { $in: followerIds }
    }).select('_id username nome fotoPerfil');

    console.log(`✅ Dados dos seguidores:`, followers);

    res.json({ followers });
  } catch (error) {
    console.error('❌ Erro ao buscar seguidores:', error);
    res.status(500).json({ message: 'Erro ao buscar seguidores', error: error.message });
  }
});

// ✅ BUSCAR LISTA DE SEGUINDO (quem o usuário segue)
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'userId é obrigatório' });
    }

    // Busca todos os follows onde followerId = userId
    const follows = await Seguidor.find({
      followerId: String(userId)
    });

    console.log(`✅ Encontrados ${follows.length} seguindo para ${userId}`);

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

export default router;