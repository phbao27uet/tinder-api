import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

const CreateMessageSchema = z.object({
  senderId: z.string(),
  receiverId: z.string(),
  matchId: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  messageType: z.enum(['TEXT', 'IMAGE']).optional(),
});

export class CreateMessageDto extends createZodDto(CreateMessageSchema) {}
