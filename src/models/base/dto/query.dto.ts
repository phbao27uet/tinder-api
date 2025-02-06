import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const SEARCH_FIELD_DEFAULT = 'slug';

export const DefaultFindAllQuerySchema = z
  .object({
    fields: z.string(),
    sort: z.string(),
    page: z.coerce.number().int().min(1),
    perPage: z.coerce.number().int().min(1),
    search: z.string().min(1).max(255),
    searchMany: z.string().transform((val) => {
      const code = val.trim();
      const codeArr = code
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      if (codeArr.length === 0) return undefined;

      return codeArr;
    }),
    searchOne: z.string().transform((val) => {
      const code = val.trim();
      if (code === '') return undefined;
      return code;
    }),
  })
  .partial();

export class DefaultFindAllQueryDto extends createZodDto(
  DefaultFindAllQuerySchema,
) {}
