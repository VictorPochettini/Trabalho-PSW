// src/database.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export async function conectaDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("🟢 MongoDB conectado com sucesso!");
  } catch (error) {
    console.error("🔴 Erro ao conectar no MongoDB:", error);
    process.exit(1);
  }
}
