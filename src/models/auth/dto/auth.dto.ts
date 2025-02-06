import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const CredentialsSchema = z.object({
  email: z.string().min(1, {
    message: 'Email is too short',
  }),
  password: z
    .string({
      message: 'Password must be a string',
    })
    .trim()
    .min(6, {
      message: 'Password is too short',
    }),
});

export class CredentialsDto extends createZodDto(CredentialsSchema) {}
