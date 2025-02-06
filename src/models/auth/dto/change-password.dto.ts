import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const ChangePasswordSchema = z.object({
  current_password: z.string().trim().min(6, {
    message: 'Mật khẩu ít nhất 6 ký tự',
  }),
  new_password: z.string().trim().min(6, {
    message: 'Mật khẩu ít nhất 6 ký tự',
  }),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
