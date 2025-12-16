// models/Post.js
import mongoose from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - usuarioId
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do post
 *           example: 507f1f77bcf86cd799439011
 *         usuarioId:
 *           type: string
 *           description: ID do autor do post
 *           example: 507f191e810c19729de860ea
 *         titulo:
 *           type: string
 *           description: Título do post
 *           example: Paisagem Digital Abstrata
 *         conteudo:
 *           type: string
 *           description: Descrição ou conteúdo textual do post
 *           example: Uma exploração de formas geométricas e cores vibrantes
 *         tipo:
 *           type: string
 *           description: Tipo/categoria do post
 *           example: visual
 *         genero:
 *           type: string
 *           description: Gênero artístico
 *           example: abstrato
 *         mediaPath:
 *           type: string
 *           nullable: true
 *           description: Caminho do arquivo de mídia (imagem ou áudio)
 *           example: uploads/image/1234567890-123456789.jpg
 *         mediaType:
 *           type: string
 *           enum: [image, audio]
 *           nullable: true
 *           description: Tipo de mídia anexada
 *           example: image
 *         data:
 *           type: string
 *           format: date-time
 *           description: Data de publicação do post
 *           example: 2024-01-15T10:30:00.000Z
 *         ratingAvg:
 *           type: number
 *           format: float
 *           description: Média das avaliações recebidas
 *           default: 0
 *           example: 4.5
 *         ratingCount:
 *           type: integer
 *           description: Número total de avaliações
 *           default: 0
 *           example: 12
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         usuarioId: 507f191e810c19729de860ea
 *         titulo: Paisagem Digital Abstrata
 *         conteudo: Uma exploração de formas geométricas
 *         tipo: visual
 *         genero: abstrato
 *         mediaPath: uploads/image/1234567890-123456789.jpg
 *         mediaType: image
 *         data: 2024-01-15T10:30:00.000Z
 *         ratingAvg: 4.5
 *         ratingCount: 12
 */
const PostSchema = new mongoose.Schema({
  usuarioId: { type: String, required: true },

  titulo: String,
  conteudo: String,
  tipo: String,     // musica, texto, visual etc.
  genero: String,

  mediaPath: String || null,
  mediaType: String || null,

  data: { type: Date, default: Date.now },

  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
});

export default mongoose.model("Post", PostSchema);