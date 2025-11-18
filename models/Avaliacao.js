import mongoose from "mongoose";

const AvaliacaoSchema = new mongoose.Schema({
  postId: { type: String, required: true },
  usuarioId: { type: String, required: true },

  estrelas: Number,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Avaliacao", AvaliacaoSchema);
