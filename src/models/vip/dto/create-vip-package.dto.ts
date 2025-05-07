import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const CreateVipPackageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  durationDays: z.number().int().positive('Duration must be a positive number'),
  price: z.number().min(0, 'Price must be a non-negative number'),
  currency: z.string().default('USD'),
  features: z.array(z.string()).optional().default([]),
});

// Create DTOs from Zod schemas
export class CreateVipPackageDto extends createZodDto(CreateVipPackageSchema) {}

// Export schema for reuse in other DTOs
export { CreateVipPackageSchema };
