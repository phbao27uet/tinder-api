export interface PaypalModuleInterface {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
}

export interface EnvironmentVariables {
  port: number;
  paypalModuleInterface: PaypalModuleInterface;
  telegram_bot_token: string;
}

export default (): EnvironmentVariables => ({
  port: process.env.PORT as unknown as number,
  telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN as string,
  paypalModuleInterface: {
    clientId: process.env.PAYPAL_CLIENT_ID as string,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET as string,
    environment: process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'live',
  },
});
