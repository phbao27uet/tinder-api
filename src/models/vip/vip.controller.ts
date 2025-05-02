import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { VipService } from './vip.service';
import { UpdateVipPackageDto, SubscribeVipDto } from './dto';
import { Auth, GetCurrentUserId } from '@shared/decorators';

@Controller('vip')
export class VipController {
  constructor(private vipService: VipService) {}

  // VIP Packages endpoints (admin usage)
  @Get('packages')
  async getAllPackages() {
    return this.vipService.getAllPackages();
  }

  @Get('packages/:id')
  async getPackageById(@Param('id') id: string) {
    return this.vipService.getPackageById(id);
  }

  @Auth('USER')
  @Put('packages/:id')
  async updatePackage(
    @Param('id') id: string,
    @Body() dto: UpdateVipPackageDto,
  ) {
    return this.vipService.updatePackage(id, dto);
  }

  @Auth('USER')
  @Delete('packages/:id')
  async deletePackage(@Param('id') id: string) {
    return this.vipService.deletePackage(id);
  }

  // User VIP subscription endpoints
  @Auth('USER')
  @Post('subscribe')
  async subscribe(
    @GetCurrentUserId() userId: string,
    @Body() dto: SubscribeVipDto,
  ) {
    return this.vipService.subscribeToVip(userId, dto);
  }

  @Auth('USER')
  @Get('status')
  async getVipStatus(@GetCurrentUserId() userId: string) {
    return this.vipService.getUserVipStatus(userId);
  }

  @Auth('USER')
  @Post('cancel')
  async cancelSubscription(@GetCurrentUserId() userId: string) {
    return this.vipService.cancelVipSubscription(userId);
  }
}
