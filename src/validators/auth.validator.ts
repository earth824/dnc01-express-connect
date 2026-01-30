import z from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(1, 'first name cannot be empty'),
  lastName: z.string().min(1, 'last name cannot be empty'),
  email: z.email('invalid email address'),
  password: z
    .string()
    .regex(
      /^[a-zA-Z0-9]{6,}$/,
      'password must have at least 6 characters and have only letter and number'
    )
});

export const loginSchema = z.object({
  email: z.string().min(1, 'email is required'),
  password: z.string().min(1, 'password is required')
});
