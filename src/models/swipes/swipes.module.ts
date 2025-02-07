import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { SwipesService } from './swipes.service';

@Module({
  imports: [PrismaModule],
  providers: [SwipesService],
  exports: [SwipesService],
})
export class SwipesModule { }
