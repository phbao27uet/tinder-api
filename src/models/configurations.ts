import sotaSheet from '../secrets/sota-sheet.json';

export interface PaypalModuleInterface {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
}

export interface GoogleServiceInterface {
  client_email: string;
  private_key: string;
}

export interface EnvironmentVariables {
  port: number;
  // paypalModuleInterface: PaypalModuleInterface;
  google: GoogleServiceInterface;

  telegram_bot_token: string;
}

export default (): EnvironmentVariables => ({
  port: process.env.PORT as unknown as number,
  google: {
    client_email: sotaSheet.client_email,
    private_key: sotaSheet.private_key,
  },
  telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN as string,
});

// paypalModuleInterface: {
//   clientId: process.env.PAYPAL_CLIENT_ID as string,
//   clientSecret: process.env.PAYPAL_CLIENT_SECRET as string,
//   environment: process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'live',
// },
