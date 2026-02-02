import type { Request, RequestHandler, Response } from 'express';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';
import bcrypt from 'bcrypt';
import { env } from '../config/env.config.js';
import { prisma } from '../db/prisma.js';
import { PrismaClientKnownRequestError } from '../db/generated/prisma/internal/prismaNamespace.js';
import {
  signAccessJwt,
  signRefreshJwt,
  verifyRefreshJwt
} from '../utils/token.js';
import { getAuthenticatedUser } from '../utils/auth.js';

const register: RequestHandler = async (req, res) => {
  const data = registerSchema.parse(req.body);
  data.password = await bcrypt.hash(data.password, env.SALT_ROUND);

  try {
    await prisma.user.create({ data });
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ message: 'email already in use' });
      return;
    }
    throw err;
  }

  res.status(201).json({ message: 'registered successfully' });
};

const login: RequestHandler = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email, status: true } });
  if (!user) {
    res.status(401).json('invalid email or password');
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json('invalid email or password');
    return;
  }

  const access_token = signAccessJwt({ id: user.id, role: user.role });
  const refresh_token = signRefreshJwt({ id: user.id });

  res.cookie('refresh_token', refresh_token, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    path: '/auth/refresh',
    maxAge: 1000 * 60 * 60 * 24 * 30
  });

  const { password: pass, ...userWithoutPassword } = user;

  res.status(200).json({ access_token, user: userWithoutPassword });
};

const refresh: RequestHandler = async (req, res) => {
  const token = req.cookies.refresh_token;
  // console.log(token);
  if (typeof token !== 'string') {
    res.status(400).json({ message: 'token is missing' });
    return;
  }

  try {
    const payload = verifyRefreshJwt(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id, status: true }
    });
    if (!user) {
      res.clearCookie('refresh_token', { path: '/auth/refresh' });
      res.status(403).json('invalid email or password');
      return;
    }
    const access_token = signAccessJwt({ id: user.id, role: user.role });
    const { password: pass, ...userWithoutPassword } = user;

    setTimeout(() => {
      res.status(200).json({ access_token, user: userWithoutPassword });
    }, 1000);
  } catch (err) {
    res.clearCookie('refresh_token', {
      // sameSite: 'strict'
      path: '/auth/refresh'
    });
    res.status(401).json();
  }
};

const logout: RequestHandler = (req, res) => {
  res
    .clearCookie('refresh_token', { path: '/auth/refresh' })
    .status(200)
    .json({ message: 'logged out successfully' });
};

const getMe = async (req: Request, res: Response) => {
  const { id } = getAuthenticatedUser(req);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(403).json({ message: 'you are banned' });
    return;
  }
  setTimeout(() => {
    res.status(200).json({ user });
  }, 5000);
};

export const authController = { register, login, refresh, logout, getMe };
