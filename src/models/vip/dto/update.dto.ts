import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { CreateVipPackageSchema } from './create-vip-package.dto';

// Make all fields optional for updates
const UpdateVipPackageSchema = CreateVipPackageSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export class UpdateVipPackageDto extends createZodDto(UpdateVipPackageSchema) {}
