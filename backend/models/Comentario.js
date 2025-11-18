import mongoose from "mongoose";

const ComentarioSchema = new mongoose.Schema({
  id: String,
  postId: { type: String, required: true },
  usuarioId: { type: String, required: true },

  texto: String,
  parentId: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },

  likes: { type: Number, default: 0 }
});

export default mongoose.model("Comentario", ComentarioSchema);
