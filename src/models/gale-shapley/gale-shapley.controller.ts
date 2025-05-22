// gale-shapley.controller.ts
import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { GaleShapleyService } from './gale-shapley.service';
import { AuthGuard } from '@models/auth/guards/auth.guard';
import { Auth, GetCurrentUserId } from '@shared/decorators';

@Controller('suggestions')
export class GaleShapleyController {
  constructor(private readonly galeShapleyService: GaleShapleyService) {}

  @Auth('USER')
  @Get('')
  async getUserSuggestions1(@GetCurrentUserId() userId: string) {
    return this.galeShapleyService.getUserSuggestions(userId);
  }

  @Auth('USER')
  @Get('by-interest')
  async getUserSuggestionsByInterest(
    @GetCurrentUserId() userId: string,
    @Query('interestId') interestId: string,
  ) {
    return this.galeShapleyService.getUserSuggestionsByInterest(
      userId,
      interestId,
    );
  }

  @Post('run/:userId')
  async run(@Param('userId') userId: string) {
    return this.galeShapleyService.run(userId);
  }

  @UseGuards(AuthGuard)
  @Get(':userId')
  async getUserSuggestions(@Param('userId') userId: string) {
    return this.galeShapleyService.getUserSuggestions(userId);
  }
}
