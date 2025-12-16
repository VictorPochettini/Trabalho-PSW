// server/utils/tokens.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Gera um Access Token JWT
 *
 * O access token é usado para autenticação nas rotas protegidas
 * via middleware `requireAuth` (Passport-JWT).
 *
 * O ID do usuário é armazenado no campo `sub` (subject), conforme
 * boas práticas do JWT.
 *
 * @function signAccessToken
 *
 * @param {string} userId - ID do usuário autenticado
 * @param {Object} [opts] - Opções adicionais
 * @param {string|number} [opts.expiresIn] - Tempo de expiração do token
 *
 * @returns {string} JWT assinado
 *
 * @example
 * const accessToken = signAccessToken(user._id.toString(), {
 *   expiresIn: '30m'
 * });
 *
 * @security JWT_SECRET
 * O segredo deve estar definido em `process.env.JWT_SECRET`
 *
 * @throws {Error} Caso o JWT_SECRET não esteja definido
 */
export function signAccessToken(userId, opts = {}) {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000)
  };

  const expiresIn = opts.expiresIn || '20m';

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/**
 * Gera um Refresh Token opaco
 *
 * Diferente do access token, o refresh token:
 * - NÃO é um JWT
 * - NÃO contém payload
 * - É armazenado no banco de dados
 * - Pode ser revogado individualmente
 *
 * Ele é utilizado para gerar novos access tokens
 * através da rota `POST /api/auth/token`.
 *
 * @function signRefreshToken
 *
 * @returns {string} Token aleatório em formato hexadecimal
 *
 * @example
 * const refreshToken = signRefreshToken();
 *
 * // salvar no usuário:
 * user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
 */
export function signRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}
