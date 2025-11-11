import express from "express";
import cors from "cors";
import authRoutes from "./src/api/auth.js";
import usersRoutes from "./src/api/users.js";
import postsRoutes from "./src/api/posts.js";
import challengesRoutes from "./src/api/challenges.js";
import followsRoutes from "./src/api/follows.js";
import ratingsRoutes from "./src/api/ratings.js";
import { errorHandler } from "./src/middlewares/error.js";

const app = express();
app.use(cors());
app.use(express.json());

// Prefixo API
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/challenges", challengesRoutes);
app.use("/api/follows", followsRoutes);
app.use("/api/ratings", ratingsRoutes);

// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

// Erros
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
