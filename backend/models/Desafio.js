// models/Desafio.js
import mongoose from 'mongoose';

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