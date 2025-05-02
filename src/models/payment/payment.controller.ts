import { Body, Controller, Post } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { DepositDto } from "./dto";
import { Auth, GetCurrentUserId } from "@shared/decorators";

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Auth('USER')
  @Post('deposit')
  async deposit(@GetCurrentUserId() userId: string, @Body() depositDto: DepositDto) {
    return this.paymentService.deposit(userId, depositDto.amount);
  }
}
