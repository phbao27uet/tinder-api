import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const UpdateUserSchema = z.object({
  role: z
    .enum([Role.ADMIN, Role.USER])
    .optional()
    .describe('The status of the user'),
  email: z.string().optional().describe('The email of the user'),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) { }

export const ChangePasswordSchema = z.object({
  new_password: z.string().trim().min(6, {
    message: 'Mật khẩu ít nhất 6 ký tự',
  }),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) { }
