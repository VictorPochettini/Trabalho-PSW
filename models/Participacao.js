import mongoose from "mongoose";

const ParticipacaoSchema = new mongoose.Schema({
  desafioId: String,
  usuarioId: String,
  postId: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Participacao", ParticipacaoSchema);
