import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { LlmModule } from '@models/llm/llm.module';
import { GaleShapleyModule } from '@models/gale-shapley/gale-shapley.module';
import { AuthModule } from '@models/auth/auth.module';

@Module({
  imports: [LlmModule, GaleShapleyModule, AuthModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
})
export class UsersModule {}
