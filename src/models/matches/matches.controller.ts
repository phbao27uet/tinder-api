import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { Auth, GetCurrentUserId } from '@shared/decorators';
import { CreateSwipeDto } from './dto';

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

  @Post('swipe')
  createSwipe(
    @GetCurrentUserId() userId: string,
    @Body() createSwipeDto: CreateSwipeDto,
  ) {
    return this.matchesService.createSwipe(
      userId,
      createSwipeDto.targetUserId,
      createSwipeDto.direction,
    );
  }
}