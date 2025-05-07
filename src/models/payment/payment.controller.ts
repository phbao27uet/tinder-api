import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PaymentService } from './payment.service';
import { DepositDto, CreatePaypalOrderDto, CapturePaypalOrderDto } from './dto';
import { Auth, GetCurrentUserId } from '@shared/decorators';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('paypal-success')
  async paypalSuccess(
    @Query('userId') userId: string,
    @Query('token') token: string,
    @Res() res: Response,
    @Query('amount') amount: number,
  ) {
    const result = await this.paymentService.capturePaypalOrder(
      token,
      userId,
      amount,
    );
    console.log(result);

    if (result?.success) {
      const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thanh Toán Thành Công</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .success-container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 40px;
            text-align: center;
            max-width: 500px;
          }
          .success-icon {
            color: #4CAF50;
            font-size: 72px;
            margin-bottom: 20px;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
          }
          p {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 20px 0;
          }
          .close-button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          .close-button:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="success-container">
          <div class="success-icon">✓</div>
          <h1>Thanh Toán Thành Công!</h1>
          <p>Thanh toán của bạn đã được xử lý thành công và tài khoản của bạn đã được cộng tiền.</p>
          <div class="amount">${result.amount.toLocaleString()} VND</div>
        </div>
      </body>
      </html>
      `;

      return res
        .status(200)
        .header('Content-Type', 'text/html')
        .send(successHtml);
    }

    return res
      .status(400)
      .json(result || { success: false, message: 'Payment failed' });
  }

  @Get('paypal-cancel')
  async paypalCancel(@Res() res: Response) {
    const cancelHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thanh Toán Đã Hủy</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .cancel-container {
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 40px;
          text-align: center;
          max-width: 500px;
        }
        .cancel-icon {
          color: #f44336;
          font-size: 72px;
          margin-bottom: 20px;
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
        }
        p {
          color: #666;
          margin-bottom: 30px;
          font-size: 16px;
        }
        .close-button {
          background-color: #f44336;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .close-button:hover {
          background-color: #d32f2f;
        }
      </style>
    </head>
    <body>
      <div class="cancel-container">
        <div class="cancel-icon">✕</div>
        <h1>Thanh Toán Đã Hủy</h1>
        <p>Thanh toán của bạn đã bị hủy. Không có khoản tiền nào bị trừ từ tài khoản của bạn.</p>
      </div>
    </body>
    </html>
    `;

    return res.status(200).header('Content-Type', 'text/html').send(cancelHtml);
  }

  @Auth('USER')
  @Post('deposit')
  async deposit(
    @GetCurrentUserId() userId: string,
    @Body() depositDto: DepositDto,
  ) {
    return this.paymentService.deposit(userId, depositDto.amount);
  }

  @Auth('USER')
  @Post('paypal/create-order')
  async createPaypalOrder(
    @GetCurrentUserId() userId: string,
    @Body() body: CreatePaypalOrderDto,
  ) {
    const { amount } = body;
    return this.paymentService.createPaypalOrder(amount, userId);
  }

  @Auth('USER')
  @Post('paypal/capture')
  async capturePaypalOrder(
    @GetCurrentUserId() userId: string,
    @Body() body: CapturePaypalOrderDto,
    @Query('amount') amount: number,
  ) {
    const { token } = body;
    return this.paymentService.capturePaypalOrder(token, userId, +amount);
  }
}
