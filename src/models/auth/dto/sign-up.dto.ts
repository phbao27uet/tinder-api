import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const SignUpSchema = z.object({
  email: z.string().min(1, {
    message: 'Tên tài khoản không được để trống',
  }),
  password: z.string().trim().min(6, {
    message: 'Mật khẩu ít nhất 6 ký tự',
  }),
  name: z.string().min(1, {
    message: 'Tên không được để trống',
  }),
  role: z.enum(
    [Role.CN_WAREHOUSE, Role.VN_USER, Role.VN_ADMIN, Role.VN_WAREHOUSE],
    {
      message: 'Role không hợp lệ',
    },
  ),
});

export class SignUpDto extends createZodDto(SignUpSchema) {}
