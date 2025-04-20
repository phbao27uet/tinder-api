import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { LlmModule } from '@models/llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
})
export class UsersModule { }
