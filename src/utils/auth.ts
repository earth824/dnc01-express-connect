import type { Request } from 'express';

export const getUserPayload = (req: Request) => {
  if (!req.user) {
    throw new Error('invalid user session');
  }
  return req.user;
};
