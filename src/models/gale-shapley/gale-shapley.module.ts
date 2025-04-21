import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { LangChainModule } from '../langchain/langchain.module';
import { GaleShapleyService } from './gale-shapley.service';
import { GaleShapleyController } from './gale-shapley.controller';
import { LlmModule } from '@models/llm/llm.module';
import { AuthGuard } from '@models/auth/guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, LlmModule, JwtModule, LangChainModule],
  controllers: [GaleShapleyController],
  providers: [GaleShapleyService, AuthGuard],
  exports: [GaleShapleyService],
})
export class GaleShapleyModule {}
