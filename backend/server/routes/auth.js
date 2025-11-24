// server/routes/auth.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../../models/Usuario.js';
import { signAccessToken, signRefreshToken } from '../utils/tokens.js';

const router = express.Router();

// -----------------------------
// REGISTER (agora usando username + password)
// -----------------------------
router.post('/register', [
  body('username').notEmpty().withMessage('username é obrigatório'),
  body('name').notEmpty().withMessage('name é obrigatório'),
  body('password').isLength({ min: 6 }).withMessage('senha deve ter ao menos 6 caracteres')
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { username, name, email, password } = req.body;

  try {
    // verifica duplicidade
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "Username já está em uso" });
    }

    const user = new User({
      username,
      name,
      email: email || null,
      password,
    });

    await user.save();

    return res.status(201).json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro no servidor" });
  }
});

// -----------------------------
// LOGIN (agora via username + password)
// -----------------------------
router.post('/login', [
  body('username').notEmpty().withMessage('username é obrigatório'),
  body('password').notEmpty().withMessage('senha é obrigatória')
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const accessToken = signAccessToken(user._id.toString(), { expiresIn: "30m" });
    const refreshToken = signRefreshToken();

    // salva refresh token
    user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
    await user.save();

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro no servidor" });
  }
});

// -----------------------------
// REFRESH TOKEN
// -----------------------------
router.post('/token', [
  body('refreshToken').notEmpty()
], async (req, res) => {

  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "refreshToken é obrigatório" });
  }

  try {
    const user = await User.findOne({ "refreshTokens.token": refreshToken });
    if (!user) {
      return res.status(403).json({ message: "Refresh token inválido" });
    }

    const newAccessToken = signAccessToken(user._id.toString(), { expiresIn: "30m" });

    return res.json({ accessToken: newAccessToken });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro no servidor" });
  }
});

// -----------------------------
// LOGOUT
// -----------------------------
router.post('/logout', [
  body('refreshToken').notEmpty()
], async (req, res) => {

  const { refreshToken } = req.body;

  try {
    await User.updateOne(
      { "refreshTokens.token": refreshToken },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );

    return res.json({ message: "Desconectado" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro no servidor" });
  }
});

export default router;
