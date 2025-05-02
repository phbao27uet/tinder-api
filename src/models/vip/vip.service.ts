import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UpdateVipPackageDto, SubscribeVipDto } from './dto';

@Injectable()
export class VipService {
  constructor(private prisma: PrismaService) {}

  // VIP Package management
  async getAllPackages() {
    return this.prisma.vipPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async getPackageById(id: string) {
    const vipPackage = await this.prisma.vipPackage.findUnique({
      where: { id },
    });

    if (!vipPackage) {
      throw new NotFoundException('VIP package not found');
    }

    return vipPackage;
  }

  async updatePackage(id: string, dto: UpdateVipPackageDto) {
    await this.getPackageById(id); // Ensure package exists

    return this.prisma.vipPackage.update({
      where: { id },
      data: dto,
    });
  }

  async deletePackage(id: string) {
    await this.getPackageById(id); // Ensure package exists

    return this.prisma.vipPackage.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // User VIP subscription
  async subscribeToVip(userId: string, dto: SubscribeVipDto) {
    const { packageId } = dto;

    // Validate package exists
    const vipPackage = await this.getPackageById(packageId);

    // Check user existence
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vipSubscription: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate subscription end date based on package duration
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + vipPackage.duration);

    // Create or update VIP subscription
    if (user.vipSubscription) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: vipPackage.price,
          },
        },
      });

      return this.prisma.vipSubscription.update({
        where: { userId },
        data: {
          packageId,
          startDate: now,
          endDate,
          isActive: true,
          paymentMethod: '',
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: vipPackage.price,
          },
        },
      });

      return this.prisma.vipSubscription.create({
        data: {
          user: { connect: { id: userId } },
          vipPackage: { connect: { id: packageId } },
          startDate: now,
          endDate,
          isActive: true,
          paymentMethod: '',
        },
      });
    }
  }

  async getUserVipStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        vipSubscription: {
          include: {
            vipPackage: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.vipSubscription) {
      return {
        isVip: false,
        subscription: null,
      };
    }

    const now = new Date();
    const isActive =
      user.vipSubscription.isActive && user.vipSubscription.endDate > now;

    // If subscription expired, update status in DB
    if (user.vipSubscription.isActive && !isActive) {
      await this.prisma.vipSubscription.update({
        where: { userId },
        data: { isActive: false },
      });
    }

    return {
      isVip: isActive,
      subscription: {
        ...user.vipSubscription,
        isActive,
      },
    };
  }

  async cancelVipSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vipSubscription: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.vipSubscription) {
      throw new BadRequestException('User has no active VIP subscription');
    }

    return this.prisma.vipSubscription.update({
      where: { userId },
      data: { isActive: false },
    });
  }
}
