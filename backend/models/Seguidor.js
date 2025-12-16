// models/Seguidor.js
import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Seguidor:
 *       type: object
 *       required:
 *         - followerId
 *         - followingId
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do relacionamento
 *           example: 507f1f77bcf86cd799439011
 *         followerId:
 *           type: string
 *           description: ID do usuário que está seguindo
 *           example: 507f191e810c19729de860ea
 *         followingId:
 *           type: string
 *           description: ID do usuário que está sendo seguido
 *           example: 507f191e810c19729de860eb
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data em que o follow foi criado
 *           example: 2024-01-15T10:30:00.000Z
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         followerId: 507f191e810c19729de860ea
 *         followingId: 507f191e810c19729de860eb
 *         createdAt: 2024-01-15T10:30:00.000Z
 */
const seguidorSchema = new mongoose.Schema({
  followerId: {
    type: String,
    required: true,
    index: true
  },
  followingId: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice composto para evitar duplicatas
seguidorSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Índices para queries de contagem
seguidorSchema.index({ followingId: 1 });
seguidorSchema.index({ followerId: 1 });

const Seguidor = mongoose.model('Seguidor', seguidorSchema);

export default Seguidor;