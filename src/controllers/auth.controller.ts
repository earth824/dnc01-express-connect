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
import { getUserPayload } from '../utils/auth.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

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
      maxAge: env.REFRESH_JWT_COOKIE_MAX_AGE
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
  res.clearCookie('refresh_token').status(200).json({ message: 'logged out' });
};

const refresh: RequestHandler = async (req, res) => {
  const token = req.cookies.refresh_token;
  if (typeof token !== 'string') {
    res.status(400).json({ message: 'token is missing' });
    return;
  }

  try {
    const payload = verifyRefreshJwt(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id, status: true },
      omit: { password: true }
    });
    if (!user) {
      res.clearCookie('refresh_token');
      res
        .status(403)
        .json({ message: 'user has been deleted or user is banned' });
      return;
    }

    const access_token = signAccessJwt({ id: user.id, role: user.role });
    res.status(200).json({ access_token, user });
  } catch (err) {
    // TokenExpiredError, JsonWebtokenError
    if (
      err instanceof jwt.TokenExpiredError ||
      err instanceof jwt.JsonWebTokenError
    ) {
      res.clearCookie('refresh_token');
      res.status(401).json({ message: 'invalid token or token expired' });
      return;
    }
    throw err;
  }
};

const uploadProfileImage: RequestHandler = async (req, res) => {
  console.log(req.file);
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path);
    console.log(result);
    const userPayload = getUserPayload(req);
    await prisma.user.update({
      where: { id: userPayload.id },
      data: { imageUrl: result.secure_url }
    });
    res.status(200).json({ imageUrl: result.secure_url });
  }
};

export const authController = {
  register,
  login,
  getMe,
  logout,
  refresh,
  uploadProfileImage
};

// { message: string, errCode:  }
// { message: 'email in use', errCode: 'EMAIL_ALRAEDY_EXISTS' }
// {
//   public_id: 'cr4mxeqx5zb8rlakpfkg',
//   version: 1571218330,
//   signature: '63bfbca643baa9c86b7d2921d776628ac83a1b6e',
//   width: 864,
//   height: 576,
//   format: 'jpg',
//   resource_type: 'image',
//   created_at: '2017-06-26T19:46:03Z',
//   bytes: 120253,
//   type: 'upload',
//   url: 'http://res.cloudinary.com/demo/image/upload/v1571218330/cr4mxeqx5zb8rlakpfkg.jpg',
//   secure_url: 'https://res.cloudinary.com/demo/image/upload/v1571218330/cr4mxeqx5zb8rlakpfkg.jpg'
// }
