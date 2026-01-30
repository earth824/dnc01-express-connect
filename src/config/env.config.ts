import 'dotenv/config';
import z from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().min(0).max(65535),
  FRONTEND_URL: z.url(),
  DATABASE_URL: z.url(),
  SALT_ROUND: z.coerce.number().int().min(10).max(15),
  ACCESS_JWT_SECRET: z.string().min(32),
  ACCESS_JWT_EXPIRES_IN: z.coerce.number().int().positive(),
  REFRESH_JWT_SECRET: z.string().min(32),
  REFRESH_JWT_EXPIRES_IN: z.coerce.number().int().positive()
});

const { success, data, error } = envSchema.safeParse(process.env);
if (!success) {
  console.log('env validation failed');
  console.log(z.prettifyError(error));
  process.exit(1);
}

export const env = data;
