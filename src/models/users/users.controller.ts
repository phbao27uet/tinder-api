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
import { Auth } from '@shared/decorators';
import { DefaultFindAllQueryDto } from '@models/base/dto';
import { ChangePasswordDto, UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Auth('VN_ADMIN')
  @Get()
  async findAll(@Query() queryDto: DefaultFindAllQueryDto) {
    return this.userService.findAll(queryDto);
  }

  @Get('change-email')
  async changeEmail() {
    return this.userService.changeEmail();
  }

  @Auth('VN_ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.userService.update(+id, updateDto);
  }

  @Auth('VN_ADMIN')
  @Patch(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() updateDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(+id, updateDto);
  }

  @Auth('VN_ADMIN')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.delete(+id);
  }
}
