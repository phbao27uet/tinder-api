import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { GaleShapleyModule } from '../gale-shapley/gale-shapley.module';
import { LangChainModule } from '../langchain/langchain.module';

@Module({
  imports: [PrismaModule, GaleShapleyModule, LangChainModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
