import type { RequestHandler } from 'express';

const register: RequestHandler = (req, res) => {
  res.status(201).json({ message: 'registered successfully' });
};

export const authController = { register };
