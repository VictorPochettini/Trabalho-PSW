import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  admin: { type: Boolean, default: false },
  bio: String,

  generosMusicais: String,
  estilosArte: String,

  ratingAvgRecebida: { type: Number, default: 0 },
  ratingCountRecebida: { type: Number, default: 0 },

  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },

  fotoPerfil: { type: String, default: "/src/images/avatarPadrao.png" }
});

export default mongoose.model("User", UserSchema);
