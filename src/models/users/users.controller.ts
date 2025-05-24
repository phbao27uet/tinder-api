/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './users.service';
import { Auth, GetCurrentUserId } from '@shared/decorators';
import { DefaultFindAllQueryDto } from '@models/base/dto';
import { ChangePasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth('ADMIN')
  @Get()
  async findAll(@Query() queryDto: DefaultFindAllQueryDto) {
    return this.userService.findAll(queryDto);
  }

  @Post('generate')
  async generate() {
    return this.userService.generate();
  }

  @Auth('USER')
  @Get('profile')
  async profile(@GetCurrentUserId() id: string) {
    return this.userService.getProfile(id);
  }

  @Auth('USER')
  @Get('matches')
  async matches(@GetCurrentUserId() id: string) {
    return this.userService.findMatches(id);
  }

  @Auth('USER')
  @Get('balance')
  async balance(@GetCurrentUserId() id: string) {
    return this.userService.getBalance(id);
  }

  @Auth('USER')
  @Get('subscription-history')
  async getSubscriptionHistory(@GetCurrentUserId() userId: string) {
    return this.userService.getSubscriptionHistory(userId);
  }

  @Auth('USER')
  @Get('match-history')
  async getMatchHistory(@GetCurrentUserId() userId: string) {
    return this.userService.getMatchHistory(userId);
  }

  @Auth('USER')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Get(':id/matches')
  async getMatches(@Param('id') id: string) {
    return this.userService.findMatches(id);
  }

  @Auth('USER')
  @Patch('profile')
  async updateProfile(
    @GetCurrentUserId() id: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateDto);
  }

  @Auth('USER')
  @Patch('location')
  async updateLocation(
    @GetCurrentUserId() id: string,
    @Body() updateDto: UpdateLocationDto,
  ) {
    return this.userService.updateLocation(id, updateDto);
  }

  @Auth('USER')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.userService.update(id, updateDto);
  }

  @Auth('USER')
  @Patch(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() updateDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(id, updateDto);
  }

  @Auth('USER')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
