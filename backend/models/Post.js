import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  usuarioId: { type: String, required: true },

  titulo: String,
  conteudo: String,
  tipo: String,     // musica, texto, visual etc.
  genero: String,

  data: { type: Date, default: Date.now },

  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
});

export default mongoose.model("Post", PostSchema);
