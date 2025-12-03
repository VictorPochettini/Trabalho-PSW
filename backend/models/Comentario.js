// models/Comentario.js
import mongoose from "mongoose";

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