import mongoose from "mongoose";

const DesafioSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descricao: String,
  tipo: String,       // oficial, comunidade
  subtipo: String,    // semanal, mensal

  premiacao: String,
  ganhadores: [
    {
      posicao: Number,
      usuarioId: String
    }
  ],

  criadorId: String,

  dataInicio: Date,
  dataFim: Date
});

export default mongoose.model("Desafio", DesafioSchema);
