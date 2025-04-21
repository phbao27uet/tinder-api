import { Controller, Get, Param } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { Auth, GetCurrentUserId } from '@shared/decorators';

@Auth('USER')
@Controller('matches')
export class MatchesController {
  // eslint-disable-next-line prettier/prettier
  constructor(private matchesService: MatchesService) { }

  @Get()
  getMyMatches(@GetCurrentUserId() userId: string) {
    return this.matchesService.getUserMatches(userId);
  }

  @Get('suggestions')
  getMatchSuggestions(@GetCurrentUserId() userId: string) {
    return this.matchesService.getMatchSuggestions(userId);
  }

  @Get(':id/details')
  getMatchDetails(
    @GetCurrentUserId() userId: string,
    @Param('id') matchId: string,
  ) {
    return this.matchesService.getMatchDetails(userId, matchId);
  }
}
