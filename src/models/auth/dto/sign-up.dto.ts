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
  rawProfile: z.string().min(1, {
    message: 'Thông tin không được để trống',
  }),
});

export class SignUpDto extends createZodDto(SignUpSchema) { }
