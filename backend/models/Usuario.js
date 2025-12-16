// models/Usuario.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - username
 *         - name
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do usuário
 *           example: 507f1f77bcf86cd799439011
 *         username:
 *           type: string
 *           description: Nome de usuário único (lowercase)
 *           example: artista123
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *           example: João Silva
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *           description: Email do usuário (opcional, único)
 *           example: joao.silva@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: Senha hash (bcrypt) - nunca retornada em respostas
 *           writeOnly: true
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           description: Papel do usuário no sistema
 *         bio:
 *           type: string
 *           description: Biografia do usuário
 *           example: Artista digital apaixonado por arte abstrata e design minimalista
 *         generosMusicais:
 *           type: array
 *           items:
 *             type: string
 *           description: Gêneros musicais de interesse
 *           example: [jazz, eletronica, rock]
 *         estilosArte:
 *           type: array
 *           items:
 *             type: string
 *           description: Estilos artísticos de interesse
 *           example: [abstrato, minimalista, surrealismo]
 *         ratingAvgRecebida:
 *           type: number
 *           format: float
 *           description: Média de avaliações recebidas nos posts
 *           default: 0
 *           example: 4.5
 *         ratingCountRecebida:
 *           type: integer
 *           description: Total de avaliações recebidas
 *           default: 0
 *           example: 25
 *         followersCount:
 *           type: integer
 *           description: Número de seguidores
 *           default: 0
 *           example: 150
 *         followingCount:
 *           type: integer
 *           description: Número de pessoas que o usuário segue
 *           default: 0
 *           example: 75
 *         fotoPerfil:
 *           type: string
 *           description: URL da foto de perfil
 *           default: http://localhost:5000/uploads/image/padrao.png
 *           example: http://localhost:5000/uploads/image/1234567890-123456789.jpg
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da conta
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         username: artista123
 *         name: João Silva
 *         email: joao.silva@example.com
 *         role: user
 *         bio: Artista digital apaixonado por arte abstrata
 *         generosMusicais: [jazz, eletronica]
 *         estilosArte: [abstrato, minimalista]
 *         ratingAvgRecebida: 4.5
 *         ratingCountRecebida: 25
 *         followersCount: 150
 *         followingCount: 75
 *         fotoPerfil: http://localhost:5000/uploads/image/1234567890-123456789.jpg
 *         createdAt: 2024-01-10T08:00:00.000Z
 *         updatedAt: 2024-01-15T10:30:00.000Z
 */
const usuarioSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true, default: null },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    refreshTokens: [{ token: String, createdAt: Date }], // para revogação de refresh tokens

    bio: { type: String, default: "" },

    // campos flexíveis: pode ser array ou string dependendo do front — aqui usamos array para facilitar buscas
    generosMusicais: { type: [String], default: [] },
    estilosArte: { type: [String], default: [] },

    ratingAvgRecebida: { type: Number, default: 0 },
    ratingCountRecebida: { type: Number, default: 0 },

    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },

    fotoPerfil: { type: String, default: "http://localhost:5000/uploads/image/padrao.png" }
  },
  { timestamps: true }
);

// Hash da senha antes de salvar (somente quando modificada)
usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Método para comparar senha (bcrypt.compare returns a promise)
usuarioSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove campos sensíveis ao converter para JSON (respostas da API)
usuarioSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Usuario", usuarioSchema);