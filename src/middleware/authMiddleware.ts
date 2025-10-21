import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;

  if (!bearer || !bearer.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = bearer.split(' ')[1];
  // Kita parse payload-nya
  const payload = verifyToken(token) as { id: string };

  if (!payload) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized, invalid token' });
  }

  // Tempel userId ke object req biar bisa dibaca controller
  (req as any).userId = payload.id;
  next();
};