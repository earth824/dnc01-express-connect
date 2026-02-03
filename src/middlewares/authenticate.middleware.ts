import type { NextFunction, Request, Response } from 'express';
import { verifyAccessJwt } from '../utils/token.js';
import jwt from 'jsonwebtoken';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // exteact access token from bearer authorization header (Bearer access_token)
  const [bearer, token] = req.headers.authorization?.split(' ') ?? [];
  if (bearer !== 'Bearer' || !token) {
    res
      .status(400)
      .json({
        message: 'invalid authorization scheme or token is missing',
        errCode: 'INVALID_AUTHORIZATION_HEADER'
      });
    return;
  }

  try {
    const payload = verifyAccessJwt(token);
    req.user = payload;
    next();
  } catch (err) {
    if (
      err instanceof jwt.TokenExpiredError ||
      err instanceof jwt.JsonWebTokenError
    ) {
      res.status(401).json({
        message: 'invalid token or token has been expired',
        errCode: 'INVALID_ACCESS_TOKEN'
      });
      return;
    }
    throw err;
  }
};
