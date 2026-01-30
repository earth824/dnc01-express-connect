import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.config.js';

export const error: ErrorRequestHandler = (err, req, res, next) => {
  let message =
    err instanceof Error ? err.message : 'unexpected error occurred';
  if (env.NODE_ENV === 'production') {
    message = 'internal server error';
  }
  res.status(500).json({ message });
};
