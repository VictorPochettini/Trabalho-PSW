// server/middleware/auth.js
import passport from 'passport';

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: |
 *         Autenticação via JWT.
 *
 *         O token é obtido em **POST /api/auth/login** e deve ser enviado no header:
 *
 *         `Authorization: Bearer <accessToken>`
 *
 *         O access token possui expiração curta e pode ser renovado via
 *         **POST /api/auth/token** usando um refresh token válido.
 */

/**
 * Middleware de autenticação JWT
 *
 * Usa Passport-JWT para validar o token enviado no header Authorization.
 * Caso válido, injeta o usuário autenticado em `req.user`.
 *
 * @middleware
 * @name requireAuth
 *
 * @returns {Function} Middleware Express
 *
 * @throws {401} Token ausente, inválido ou expirado
 */
export const requireAuth = passport.authenticate('jwt', { session: false });

/**
 * Middleware de autorização por role
 *
 * Verifica se o usuário autenticado possui a role exigida.
 * Deve ser usado **após** o middleware `requireAuth`.
 *
 * @middleware
 * @name requireRole
 *
 * @param {string} role - Role exigida (ex: 'admin', 'user')
 * @returns {Function} Middleware Express
 *
 * @throws {401} Usuário não autenticado
 * @throws {403} Usuário não autorizado
 */
export const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.role !== role) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  next();
};

/**
 * Middleware de verificação de ownership (propriedade do recurso)
 *
 * Permite acesso apenas ao dono do recurso ou a um usuário admin.
 * Deve ser usado **após** o middleware `requireAuth`.
 *
 * @middleware
 * @name requireOwnership
 *
 * @param {Function} getResourceOwnerId
 * Função assíncrona que recebe o request e retorna o ID do dono do recurso.
 *
 * @returns {Function} Middleware Express
 *
 * @throws {401} Usuário não autenticado
 * @throws {404} Recurso não encontrado
 * @throws {403} Usuário não é dono nem admin
 */
export const requireOwnership = (getResourceOwnerId) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const ownerId = await getResourceOwnerId(req);

    if (!ownerId) {
      return res.status(404).json({ message: 'Recurso não encontrado' });
    }

    const isOwner = ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    next();
  } catch (err) {
    next(err);
  }
};
