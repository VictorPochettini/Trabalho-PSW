// server/models/Usuario.js (ES modules)
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const usuarioSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true, default: null },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    refreshTokens: [{ token: String, createdAt: Date }], // para revogação de refresh tokens

    bio: { type: String, default: "" },

    // campos flexíveis: pode ser array ou string dependendo do front — aqui usamos array para facilitar buscas
    generosMusicais: { type: [String], default: [] },
    estilosArte: { type: [String], default: [] },

    ratingAvgRecebida: { type: Number, default: 0 },
    ratingCountRecebida: { type: Number, default: 0 },

    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },

    fotoPerfil: { type: String, default: "/images/avatarPadrao.png" }
  },
  { timestamps: true }
);

// Hash da senha antes de salvar (somente quando modificada)
usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Método para comparar senha (bcrypt.compare returns a promise)
usuarioSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove campos sensíveis ao converter para JSON (respostas da API)
usuarioSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Usuario", usuarioSchema);
