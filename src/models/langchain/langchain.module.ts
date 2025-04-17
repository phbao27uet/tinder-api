import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LangChainService } from './langchain.service';
import { PrismaModule } from '@shared/prisma';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [LangChainService],
  exports: [LangChainService],
})
// eslint-disable-next-line prettier/prettier
export class LangChainModule { }
