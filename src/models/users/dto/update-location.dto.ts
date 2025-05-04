import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const UpdateLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export class UpdateLocationDto extends createZodDto(UpdateLocationSchema) { }
