// models/Avaliacao.js
import mongoose from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Avaliacao:
 *       type: object
 *       required:
 *         - postId
 *         - usuarioId
 *         - estrelas
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único da avaliação
 *           example: 507f1f77bcf86cd799439011
 *         postId:
 *           type: string
 *           description: ID do post avaliado
 *           example: 507f191e810c19729de860ea
 *         usuarioId:
 *           type: string
 *           description: ID do usuário que avaliou
 *           example: 507f191e810c19729de860eb
 *         estrelas:
 *           type: integer
 *           description: Nota de 1 a 5 estrelas
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da avaliação
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         postId: 507f191e810c19729de860ea
 *         usuarioId: 507f191e810c19729de860eb
 *         estrelas: 5
 *         createdAt: 2024-01-15T10:30:00.000Z
 *         updatedAt: 2024-01-15T10:30:00.000Z
 */
const AvaliacaoSchema = new mongoose.Schema({
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post',
    required: true 
  },
  usuarioId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario',
    required: true 
  },
  estrelas: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Índice composto único: um usuário só pode avaliar um post uma vez
AvaliacaoSchema.index({ postId: 1, usuarioId: 1 }, { unique: true });

export default mongoose.model("Avaliacao", AvaliacaoSchema);