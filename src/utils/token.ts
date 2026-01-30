import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';

type AccessJwtPayload = {
  id: number;
  role: 'admin' | 'user';
};

type RefreshJwtPayload = {
  id: number;
};

export const signAccessJwt = (payload: AccessJwtPayload): string =>
  jwt.sign(payload, env.ACCESS_JWT_SECRET, {
    expiresIn: env.ACCESS_JWT_EXPIRES_IN
  });

export const signRefreshJwt = (payload: RefreshJwtPayload): string =>
  jwt.sign(payload, env.REFRESH_JWT_SECRET, {
    expiresIn: env.REFRESH_JWT_EXPIRES_IN
  });
