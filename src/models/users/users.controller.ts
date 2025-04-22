/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { UserService } from './users.service';
import { Auth, GetCurrentUserId } from '@shared/decorators';
import { DefaultFindAllQueryDto } from '@models/base/dto';
import { ChangePasswordDto, UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Auth('ADMIN')
  @Get()
  async findAll(@Query() queryDto: DefaultFindAllQueryDto) {
    return this.userService.findAll(queryDto);
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

  @Get(':id/matches')
  async getMatches(@Param('id') id: string) {
    return this.userService.findMatches(id);
  }

  @Auth('ADMIN', 'USER')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.userService.update(id, updateDto);
  }

  @Auth('ADMIN', 'USER')
  @Patch(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() updateDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(id, updateDto);
  }

  @Auth('ADMIN', 'USER')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
