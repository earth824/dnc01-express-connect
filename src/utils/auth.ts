import type { Request } from 'express';
import type { AccessJwtPayload } from './token.js';

export const getAuthenticatedUser = (req: Request): AccessJwtPayload => {
  if (!req.user) throw new Error('Invalid user session');
  return req.user;
};
