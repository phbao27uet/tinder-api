import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { GaleShapleyService } from './gale-shapley.service';

@Module({
  imports: [PrismaModule],
  providers: [GaleShapleyService],
  exports: [GaleShapleyService],
})
export class GaleShapleyModule { }
