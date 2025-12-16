// models/Comentario.js
import mongoose from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Comentario:
 *       type: object
 *       required:
 *         - postId
 *         - usuarioId
 *         - texto
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do comentário
 *           example: 507f1f77bcf86cd799439011
 *         postId:
 *           type: string
 *           description: ID do post comentado
 *           example: 507f191e810c19729de860ea
 *         usuarioId:
 *           type: string
 *           description: ID do autor do comentário
 *           example: 507f191e810c19729de860eb
 *         texto:
 *           type: string
 *           description: Conteúdo do comentário
 *           example: Adorei essa arte! Muito criativa!
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: ID do comentário pai (para respostas aninhadas)
 *           example: 507f191e810c19729de860ec
 *         likes:
 *           type: integer
 *           description: Número de likes recebidos
 *           default: 0
 *           example: 15
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Data de exclusão (soft delete)
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do comentário
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         postId: 507f191e810c19729de860ea
 *         usuarioId: 507f191e810c19729de860eb
 *         texto: Que arte incrível! Parabéns!
 *         parentId: null
 *         likes: 15
 *         deletedAt: null
 *         createdAt: 2024-01-15T10:30:00.000Z
 *         updatedAt: 2024-01-15T10:30:00.000Z
 */
const ComentarioSchema = new mongoose.Schema({
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
  texto: { 
    type: String, 
    required: true,
    trim: true
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comentario',
    default: null 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
  likes: { type: Number, default: 0 }
}, {
  timestamps: true // Adiciona/atualiza createdAt e updatedAt automaticamente
});

// Índices para performance
ComentarioSchema.index({ postId: 1, createdAt: -1 }); // Buscar por post
ComentarioSchema.index({ parentId: 1 }); // Buscar respostas
ComentarioSchema.index({ usuarioId: 1 }); // Buscar por usuário

// Virtual para ID como string (compatibilidade)
ComentarioSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Configurar toJSON para incluir virtuals
ComentarioSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    return ret;
  }
});

export default mongoose.model("Comentario", ComentarioSchema);