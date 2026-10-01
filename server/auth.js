import { getUserBySession } from './db.js';

/**
 * Strict authentication middleware.
 * Requires a valid Bearer session token.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.slice(7).trim();
  const user = getUserBySession(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.user = user;
  req.userId = user.id;
  req.token = token;
  next();
}

/**
 * Optional authentication middleware.
 * Attaches user if valid session token provided, but does not block guests.
 */
export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const user = getUserBySession(token);
    if (user) {
      req.user = user;
      req.userId = user.id;
      req.token = token;
    }
  }
  next();
}
