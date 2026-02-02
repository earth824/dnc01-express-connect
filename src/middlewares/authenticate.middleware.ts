import type { NextFunction, Request, Response } from 'express';
import { verifyAccessJwt } from '../utils/token.js';
import jwt from 'jsonwebtoken';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [bearer, token] = req.headers.authorization?.split(' ') ?? [];
  if (bearer !== 'Bearer' || !token) {
    res.status(400).json({ message: 'invalid authorization header' });
    return;
  }

  try {
    const payload = verifyAccessJwt(token);
    req.user = payload;
  } catch (err) {
    if (
      err instanceof jwt.JsonWebTokenError ||
      err instanceof jwt.TokenExpiredError
    ) {
      res.status(401).json({ message: 'invalid token or expired' });
      return;
    }
    throw err;
  }

  next();
};
