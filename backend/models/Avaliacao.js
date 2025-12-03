// models/Avaliacao.js
import mongoose from "mongoose";

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