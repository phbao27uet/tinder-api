import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const SearchSettingsSchema = z.object({
  ageRange: z.array(z.number()).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'BOTH']).optional(),
  preferredDistance: z.number().optional(),
  hasBio: z.boolean().optional(),
});

export class SearchSettingsDto extends createZodDto(SearchSettingsSchema) {}
