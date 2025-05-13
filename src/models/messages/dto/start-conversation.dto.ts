import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

const StartConversationSchema = z.object({
  receiverId: z.string().uuid(),
  matchId: z.string().uuid().optional(),
  content: z.string(),
});

export class StartConversationDto extends createZodDto(
  StartConversationSchema,
) {}
