import jwt from 'jsonwebtoken';

// Ambil secret dari .env, kasih default fallback (walau gak ideal)
const JWT_SECRET = process.env.JWT_SECRET || 'secret-default';

export const signToken = (payload: { id: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null; // Token invalid
  }
};