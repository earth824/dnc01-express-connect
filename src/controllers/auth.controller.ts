import type { RequestHandler } from 'express';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';
import bcrypt from 'bcrypt';
import { env } from '../config/env.config.js';
import { prisma } from '../db/prisma.js';
import { PrismaClientKnownRequestError } from '../db/generated/prisma/internal/prismaNamespace.js';
import { signAccessJwt, signRefreshJwt } from '../utils/token.js';

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
  const { password: pass, ...userWithoutPassword } = user;

  res.status(200).json({ access_token, user: userWithoutPassword });
};

export const authController = { register, login };
