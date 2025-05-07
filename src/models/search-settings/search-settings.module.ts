import { Module } from '@nestjs/common';
import { SearchSettingsService } from './search-settings.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { SearchSettingsController } from './search-settings.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SearchSettingsController],
  providers: [SearchSettingsService],
  exports: [SearchSettingsService],
})
export class SearchSettingsModule {}