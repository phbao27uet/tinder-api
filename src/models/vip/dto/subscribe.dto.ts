import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

// Create schema for subscription
const SubscribeVipSchema = z.object({
  packageId: z.string(),
});

export class SubscribeVipDto extends createZodDto(SubscribeVipSchema) {}
