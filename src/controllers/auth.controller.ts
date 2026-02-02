import type { Request, RequestHandler, Response } from 'express';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';
import bcrypt from 'bcrypt';
import { env } from '../config/env.config.js';
import { prisma } from '../db/prisma.js';
import { PrismaClientKnownRequestError } from '../db/generated/prisma/internal/prismaNamespace.js';
import { signAccessJwt, signRefreshJwt } from '../utils/token.js';
import { getUserPayload } from '../utils/auth.js';

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
    res.status(401).json({ message: 'invalid email or password' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json({ message: 'invalid email or password' });
    return;
  }

  const access_token = signAccessJwt({ id: user.id, role: user.role });
  const refresh_token = signRefreshJwt({ id: user.id });
  const { password: pass, ...userWithoutPassword } = user;

  res
    .cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: env.REFRESH_JWT_COOKIE_MAX_AGE,
      path: '/auth'
    })
    .status(200)
    .json({ user: userWithoutPassword, access_token });

  // res.status(200).json({ access_token, user: userWithoutPassword });
};

const getMe = async (req: Request, res: Response) => {
  const payload = getUserPayload(req);
  const user = await prisma.user.findUnique({
    where: { id: payload.id, status: true },
    omit: { password: true }
  });

  if (!user) {
    res
      .status(403)
      .json({ message: 'user has been deleted or user is banned' });
    return;
  }

  res.status(200).json({ user });
};

const logout: RequestHandler = (req, res) => {
  res.clearCookie('access_token').status(200).json({ message: 'logged out' });
};

const refresh: RequestHandler = (req, res) => {
  const token = req.cookies.refresh_token;
};

export const authController = { register, login, getMe, logout, refresh };
