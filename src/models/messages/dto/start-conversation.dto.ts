import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

const StartConversationSchema = z.object({
  receiverId: z.string(),
  matchId: z.string().optional(),
  content: z.string(),
});

export class StartConversationDto extends createZodDto(
  StartConversationSchema,
) {}
