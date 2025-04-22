// gale-shapley.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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

  @UseGuards(AuthGuard)
  @Get(':userId')
  async getUserSuggestions(@Param('userId') userId: string) {
    return this.galeShapleyService.getUserSuggestions(userId);
  }
}
