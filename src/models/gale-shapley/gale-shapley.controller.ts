// gale-shapley.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GaleShapleyService } from './gale-shapley.service';
import { AuthGuard } from '@models/auth/guards/auth.guard';

@Controller('suggestions')
export class GaleShapleyController {
  constructor(private readonly galeShapleyService: GaleShapleyService) {}

  @UseGuards(AuthGuard)
  @Get(':userId')
  async getUserSuggestions(@Param('userId') userId: string) {
    return this.galeShapleyService.getUserSuggestions(userId);
  }
}
