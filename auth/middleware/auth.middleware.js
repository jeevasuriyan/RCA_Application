import { verifyToken } from '../utils/jwt.utils.js';

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Sets req.user = { id, email, name }
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}
