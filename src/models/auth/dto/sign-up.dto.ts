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
  password: z.string().trim().min(1, {
    message: 'Mật khẩu ít nhất 1 ký tự',
  }),
  name: z.string().min(1, {
    message: 'Tên không được để trống',
  }),
  birthday: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
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
  shortVideo: z.string().optional(),
  preferredDistance: z.number().optional(),
  longitude: z.number().optional(),
  latitude: z.number().optional(),
});

export class SignUpDto extends createZodDto(SignUpSchema) {}

const checkEmailSchema = z.object({
  email: z.string().min(1, {
    message: 'Tên tài khoản không được để trống',
  }),
});

export class CheckEmailDto extends createZodDto(checkEmailSchema) {}
