import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async deposit(id: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    return {
      balance: updatedUser.balance,
    }
  }
}
