// server/middleware/auth.js
import passport from 'passport';

// protege rota (usa passport-jwt)
export const requireAuth = passport.authenticate('jwt', { session: false });

// checa role: exemplo usage requireRole('admin')
export const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
  next();
};

// checa ownership: compara req.user._id com recurso.ownerId (string/objectid)
export const requireOwnership = (getResourceOwnerId) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const ownerId = await getResourceOwnerId(req); // função que recupera o owner id do recurso
    if (!ownerId) return res.status(404).json({ message: 'Recurso não encontrado' });

    if (ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  } catch (err) {
    next(err);
  }
};
