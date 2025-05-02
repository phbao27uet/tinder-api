import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const CreateSwipeSchema = z.object({
    targetUserId: z.string(),
    direction: z.enum(['LEFT', 'RIGHT', 'UP']),
});

export class CreateSwipeDto extends createZodDto(CreateSwipeSchema) {}
