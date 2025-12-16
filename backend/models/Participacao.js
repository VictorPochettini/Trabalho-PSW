// models/Participacao.js
import mongoose from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Participacao:
 *       type: object
 *       required:
 *         - desafioId
 *         - usuarioId
 *         - postId
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único da participação
 *           example: 507f1f77bcf86cd799439011
 *         desafioId:
 *           type: string
 *           description: ID do desafio
 *           example: 507f191e810c19729de860ea
 *         usuarioId:
 *           type: string
 *           description: ID do usuário participante
 *           example: 507f191e810c19729de860eb
 *         postId:
 *           type: string
 *           description: ID do post submetido ao desafio
 *           example: 507f191e810c19729de860ec
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data da submissão
 *           example: 2024-01-15T10:30:00.000Z
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         desafioId: 507f191e810c19729de860ea
 *         usuarioId: 507f191e810c19729de860eb
 *         postId: 507f191e810c19729de860ec
 *         createdAt: 2024-01-15T10:30:00.000Z
 */
const ParticipacaoSchema = new mongoose.Schema({
  desafioId: String,
  usuarioId: String,
  postId: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Participacao", ParticipacaoSchema);