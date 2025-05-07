import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const DepositSchema = z.object({
  amount: z.number().min(0, 'Amount must be a non-negative number'),
});

export class DepositDto extends createZodDto(DepositSchema) {}

const CreatePaypalOrderSchema = z.object({
  amount: z.number().min(0, 'Amount must be a non-negative number'),
});

export class CreatePaypalOrderDto extends createZodDto(
  CreatePaypalOrderSchema,
) {}

const CapturePaypalOrderSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export class CapturePaypalOrderDto extends createZodDto(
  CapturePaypalOrderSchema,
) {}
