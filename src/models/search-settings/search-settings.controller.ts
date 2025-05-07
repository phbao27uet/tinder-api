import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SearchSettingsService } from './search-settings.service';
import { Auth, GetCurrentUserId } from '@shared/decorators';
import { SearchSettingsDto } from './dto';

@Controller('search-settings')
export class SearchSettingsController {
  constructor(private readonly searchSettingsService: SearchSettingsService) {}

  @Auth('USER')
  @Get('')
  async get(@GetCurrentUserId() userId: string) {
    return this.searchSettingsService.get(userId);
  }

  @Auth('USER')
  @Patch('')
  async update(
    @GetCurrentUserId() userId: string,
    @Body() searchSettingsDto: SearchSettingsDto,
  ) {
    return this.searchSettingsService.update(userId, searchSettingsDto);
  }
}
