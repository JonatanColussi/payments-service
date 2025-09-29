import { registerAs } from '@nestjs/config';

export default registerAs('mercadopago', () => ({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
  webhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  timeout: parseInt(process.env.MERCADOPAGO_TIMEOUT || '5000'),
  retries: parseInt(process.env.MERCADOPAGO_RETRIES || '3'),
  backUrls: {
    success: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3001/payment/success',
    failure: process.env.PAYMENT_FAILURE_URL || 'http://localhost:3001/payment/failure',
    pending: process.env.PAYMENT_PENDING_URL || 'http://localhost:3001/payment/pending',
  },
}));
