// backend/models/Seguidor.js
import mongoose from 'mongoose';

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