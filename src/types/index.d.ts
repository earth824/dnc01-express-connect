import 'express';
import type { AccessJwtPayload } from '../utils/token.ts';

declare module 'express' {
  interface Request {
    user?: AccessJwtPayload;
  }
}
