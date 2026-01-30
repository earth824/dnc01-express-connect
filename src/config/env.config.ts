import 'dotenv/config';
import z from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().min(0).max(65535)
});

const { success, data, error } = envSchema.safeParse(process.env);
if (!success) {
  console.log('env validation failed');
  console.log(z.prettifyError(error));
  process.exit(1);
}

export const env = data;
