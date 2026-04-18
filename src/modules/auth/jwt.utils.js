import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'rca_app_jwt_secret_CHANGE_IN_PRODUCTION';
const EXPIRES = process.env.JWT_EXPIRES || '24h';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
