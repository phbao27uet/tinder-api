import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import {
  AlcoholConsumption,
  CommunicationStyle,
  DietaryPreference,
  Education,
  ExerciseFrequency,
  FutureFamily,
  Gender,
  LookingFor,
  LoveLanguage,
  Pets,
  SleepPattern,
  SmokingPreference,
  SocialMediaUsage,
  ZodiacSign,
} from '@prisma/client';


const UpdateUserSchema = z.object({
  rawProfile: z.string().min(1, {
    message: 'Thông tin không được để trống',
  }),
  images: z.array(z.string()),
  // ====
  interests: z.array(z.string()).optional(),
  lookingFor: z.nativeEnum(LookingFor).optional(),
  languages: z.array(z.string()).optional(),
  zodiacSign: z.nativeEnum(ZodiacSign).optional(),
  education: z.nativeEnum(Education).optional(),
  futureFamily: z.nativeEnum(FutureFamily).optional(),
  communicationStyle: z.nativeEnum(CommunicationStyle).optional(),
  loveLanguage: z.nativeEnum(LoveLanguage).optional(),
  pet: z.nativeEnum(Pets).optional(),
  alcoholConsumption: z.nativeEnum(AlcoholConsumption).optional(),
  smoking: z.nativeEnum(SmokingPreference).optional(),
  exerciseHabit: z.nativeEnum(ExerciseFrequency).optional(),
  diet: z.nativeEnum(DietaryPreference).optional(),
  socialMediaActivity: z.nativeEnum(SocialMediaUsage).optional(),
  sleepHabit: z.nativeEnum(SleepPattern).optional(),
  preferredDistance: z.number().optional(),
});

const checkEmailSchema = z.object({
  email: z.string().min(1, {
    message: 'Tên tài khoản không được để trống',
  }),
});

export class CheckEmailDto extends createZodDto(checkEmailSchema) { }

export class UpdateUserDto extends createZodDto(UpdateUserSchema) { }

export const ChangePasswordSchema = z.object({
  new_password: z.string().trim().min(6, {
    message: 'Mật khẩu ít nhất 6 ký tự',
  }),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) { }
