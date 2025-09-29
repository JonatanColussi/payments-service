import { registerAs } from '@nestjs/config';

export default registerAs('mercadopago', () => ({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-7639895969324989-092908-29a76b93a0570b89017f6f04903fe8ab-2720512788',
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || 'APP_USR-fe8040ce-fd1c-46b0-8400-14b046ad80f8',
  webhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL || 'https://your-domain.ngrok.io/api/webhooks/mercadopago/notifications',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  timeout: parseInt(process.env.MERCADOPAGO_TIMEOUT || '5000'),
  retries: parseInt(process.env.MERCADOPAGO_RETRIES || '3'),
  backUrls: {
    success: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3001/payment/success',
    failure: process.env.PAYMENT_FAILURE_URL || 'http://localhost:3001/payment/failure',
    pending: process.env.PAYMENT_PENDING_URL || 'http://localhost:3001/payment/pending',
  },
}));
