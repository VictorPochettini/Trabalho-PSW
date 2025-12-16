// models/Desafio.js
import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Desafio:
 *       type: object
 *       required:
 *         - titulo
 *         - criadorId
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do desafio
 *           example: 507f1f77bcf86cd799439011
 *         titulo:
 *           type: string
 *           description: Título do desafio
 *           example: Desafio de Cores Vibrantes
 *         descricao:
 *           type: string
 *           description: Descrição detalhada do desafio
 *           example: Crie uma arte usando apenas cores primárias e seus complementares
 *         tipo:
 *           type: string
 *           enum: [oficial, comunidade]
 *           default: comunidade
 *           description: Tipo do desafio (oficial ou criado pela comunidade)
 *         criadorId:
 *           type: string
 *           description: ID do usuário criador do desafio
 *           example: 507f191e810c19729de860ea
 *         dataInicio:
 *           type: string
 *           format: date-time
 *           description: Data de início do desafio
 *           example: 2024-01-15T00:00:00.000Z
 *         dataFim:
 *           type: string
 *           format: date-time
 *           description: Data de término do desafio
 *           example: 2024-02-15T23:59:59.000Z
 *         tipoAceito:
 *           type: array
 *           items:
 *             type: string
 *             enum: [musica, visual, texto]
 *           description: Tipos de posts aceitos no desafio
 *           example: [visual, musica]
 *         tiposPermitidos:
 *           type: array
 *           items:
 *             type: string
 *             enum: [musica, visual, texto]
 *           description: Alias para tipoAceito (compatibilidade)
 *           example: [visual, musica]
 *         ganhadores:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs dos usuários vencedores
 *           default: []
 *           example: [507f191e810c19729de860eb]
 *         status:
 *           type: string
 *           enum: [rascunho, publicado, aberto, encerrado, finalizado]
 *           default: publicado
 *           description: Status atual do desafio
 *         createdBy:
 *           type: string
 *           description: ID do criador (compatibilidade)
 *           example: 507f191e810c19729de860ea
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do desafio
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         titulo: Desafio de Cores Vibrantes
 *         descricao: Crie uma arte usando apenas cores primárias
 *         tipo: comunidade
 *         criadorId: 507f191e810c19729de860ea
 *         dataInicio: 2024-01-15T00:00:00.000Z
 *         dataFim: 2024-02-15T23:59:59.000Z
 *         tipoAceito: [visual, musica]
 *         ganhadores: []
 *         status: aberto
 *         createdAt: 2024-01-10T10:00:00.000Z
 *         updatedAt: 2024-01-10T10:00:00.000Z
 */
const desafioSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['oficial', 'comunidade'],
    default: 'comunidade'
  },
  criadorId: {
    type: String,
    required: true
  },
  dataInicio: {
    type: Date
  },
  dataFim: {
    type: Date
  },
  // ✅ NOVO: Campo tipoAceito - Array de tipos de posts aceitos
  tipoAceito: {
    type: [String],
    enum: ['musica', 'visual', 'texto'],
    default: ['musica', 'visual', 'texto'] // Default: aceita todos
  },
  // Compatibilidade com código antigo (alias)
  tiposPermitidos: {
    type: [String],
    enum: ['musica', 'visual', 'texto']
  },
  ganhadores: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['rascunho', 'publicado', 'aberto', 'encerrado', 'finalizado'],
    default: 'publicado'
  },
  createdBy: {
    type: String
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// ✅ Middleware: Antes de salvar, sincronizar tipoAceito e tiposPermitidos
desafioSchema.pre('save', function(next) {
  // Se tiposPermitidos foi definido mas tipoAceito não
  if (this.tiposPermitidos && this.tiposPermitidos.length > 0 && !this.tipoAceito) {
    this.tipoAceito = this.tiposPermitidos;
  }
  
  // Se tipoAceito foi definido mas tiposPermitidos não
  if (this.tipoAceito && this.tipoAceito.length > 0 && !this.tiposPermitidos) {
    this.tiposPermitidos = this.tipoAceito;
  }
  
  // Se nenhum foi definido, usar default
  if (!this.tipoAceito || this.tipoAceito.length === 0) {
    this.tipoAceito = ['musica', 'visual', 'texto'];
  }
  
  next();
});

const Desafio = mongoose.model('Desafio', desafioSchema);

export default Desafio;