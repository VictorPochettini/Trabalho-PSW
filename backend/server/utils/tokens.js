// server/utils/tokens.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function signAccessToken(userId, opts = {}) {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000)
  };
  const expiresIn = opts.expiresIn || '20m'; // ajuste conforme necessário
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export function signRefreshToken() {
  // refresh token can be a random string (opaque) stored server-side
  return crypto.randomBytes(40).toString('hex');
}
