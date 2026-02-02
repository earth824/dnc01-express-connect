import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';

export const authRouter = express.Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
// GET /auth/me
authRouter.get('/me', authenticate, authController.getMe);
authRouter.post('/logout', authController.logout);
authRouter.get('/refresh', authController.refresh);
