import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PaymentController } from './payment.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}