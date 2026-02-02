import type { NextFunction, Request, Response } from 'express';
import { verifyAccessJwt } from '../utils/token.js';
import jwt from 'jsonwebtoken';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies.access_token;
  if (typeof accessToken !== 'string') {
    res.status(400).json({ message: 'token is missing' });
    return;
  }

  try {
    const payload = verifyAccessJwt(accessToken);
    req.user = payload;
    next();
  } catch (err) {
    // TokenExpiredError, JsonWebtokenError
    if (
      err instanceof jwt.TokenExpiredError ||
      err instanceof jwt.JsonWebTokenError
    ) {
      res.clearCookie('access_token');
      res.status(401).json({ message: 'invalid token or token expired' });
    }

    throw err;
  }
};
