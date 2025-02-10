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
  age: z.number().min(18, {
    message: 'Tuổi phải lớn hơn 18',
  }),
  gender: z.nativeEnum(Gender).optional(),
  rawProfile: z.string().min(1, {
    message: 'Thông tin không được để trống',
  }),
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
});

export class SignUpDto extends createZodDto(SignUpSchema) { }
