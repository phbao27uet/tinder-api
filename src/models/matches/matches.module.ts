import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { GaleShapleyModule } from '../gale-shapley/gale-shapley.module';
import { LangChainModule } from '../langchain/langchain.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, GaleShapleyModule, LangChainModule, MessagesModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
