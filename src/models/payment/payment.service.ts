import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaymentService {
  private paypalClient: paypal.core.PayPalHttpClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    const environmentType =
      this.configService.get<'sandbox' | 'live'>('PAYPAL_ENVIRONMENT') ||
      'sandbox';
    this.paypalClient = new paypal.core.PayPalHttpClient(
      environmentType === 'live'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret),
    );
  }

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

    console.log('updatedUser.balance', updatedUser.balance, amount);

    return {
      balance: updatedUser.balance,
    };
  }

  async createPaypalOrder(amount: number, userId: string) {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.headers['prefer'] = 'return=representation';
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: (amount / 26000).toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: `https://lldttsmt-9981.asse.devtunnels.ms/payment/paypal-success?userId=${userId}&amount=${amount}`,
          cancel_url: `https://lldttsmt-9981.asse.devtunnels.ms/payment/paypal-cancel?userId=${userId}`,
        },
      });
      const response = await this.paypalClient.execute(request);

      // Extract the order ID from the response
      const orderId = response.result.id;

      // Use the approveUrl directly from PayPal response
      const approvalUrl = response.result.links.find(
        (l) => l.rel === 'approve',
      )?.href;

      return { approvalUrl, orderId };
    } catch (err) {
      console.log(err);
    }
  }

  async capturePaypalOrder(token: string, userId: string, _amount: number) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(token);
      request.requestBody({});

      const response = await this.paypalClient.execute(request);
      const success = response.statusCode === 201;
      // total amount
      const amount =
        _amount ||
        Number(
          response.result.purchase_units[0].payments.captures[0].amount.value,
        ) * 26000;

      if (success) {
        await this.deposit(userId, Number(amount));
      }

      return { success, amount };
    } catch (err) {
      console.log(err);
    }
  }
}
