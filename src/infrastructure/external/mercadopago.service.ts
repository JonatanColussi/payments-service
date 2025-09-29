import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import {
  MercadoPagoPreference,
  MercadoPagoPaymentItem,
  MercadoPagoPaymentStatus
} from '../../domain/entities/mercadopago-payment.entity';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly client: MercadoPagoConfig;
  private readonly preference: Preference;
  private readonly payment: Payment;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>('mercadopago.accessToken') ||
                       this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');

    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN is required');
    }

    this.client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: this.configService.get<number>('mercadopago.timeout', 5000),
        idempotencyKey: 'payments-service'
      }
    });

    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  async createPreference(
    paymentId: string,
    items: MercadoPagoPaymentItem[],
    payer?: { email?: string; name?: string }
  ): Promise<MercadoPagoPreference> {
    try {
      this.logger.log(`Creating MercadoPago preference for payment ${paymentId}`);

      const preferenceData = {
        items: items.map((item, index) => ({
          id: `item-${index}`,
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: item.currency_id || 'BRL'
        })),
        external_reference: paymentId,
        notification_url: this.configService.get<string>('mercadopago.webhookUrl') ||
                         this.configService.get<string>('MERCADOPAGO_WEBHOOK_URL'),
        back_urls: {
          success: this.configService.get<string>('mercadopago.backUrls.success') ||
                  this.configService.get<string>('PAYMENT_SUCCESS_URL'),
          failure: this.configService.get<string>('mercadopago.backUrls.failure') ||
                  this.configService.get<string>('PAYMENT_FAILURE_URL'),
          pending: this.configService.get<string>('mercadopago.backUrls.pending') ||
                  this.configService.get<string>('PAYMENT_PENDING_URL')
        },
        auto_return: 'approved' as const,
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12
        },
        payer: payer ? {
          email: payer.email,
          name: payer.name
        } : undefined
      };

      const response = await this.preference.create({ body: preferenceData });

      this.logger.log(`MercadoPago preference created successfully: ${response.id}`);

      return {
        id: response.id!,
        init_point: response.init_point!,
        sandbox_init_point: response.sandbox_init_point!,
        collector_id: response.collector_id!,
        client_id: response.client_id!,
        payment_status: 'pending'
      };
    } catch (error) {
      this.logger.error(`Error creating MercadoPago preference: ${error.message}`, error.stack);
      throw new Error(`Failed to create MercadoPago preference: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<MercadoPagoPaymentStatus | null> {
    try {
      this.logger.log(`Getting payment status from MercadoPago: ${paymentId}`);

      const response = await this.payment.get({ id: paymentId });

      if (!response) {
        this.logger.warn(`Payment not found in MercadoPago: ${paymentId}`);
        return null;
      }

      return {
        id: response.id!.toString(),
        status: response.status as any,
        status_detail: response.status_detail!,
        external_reference: response.external_reference!,
        transaction_amount: response.transaction_amount!,
        date_created: response.date_created!,
        date_approved: response.date_approved || undefined
      };
    } catch (error) {
      this.logger.error(`Error getting payment status from MercadoPago: ${error.message}`, error.stack);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async searchPaymentsByExternalReference(externalReference: string): Promise<MercadoPagoPaymentStatus[]> {
    try {
      this.logger.log(`Searching payments by external reference: ${externalReference}`);

      const response = await this.payment.search({
        options: {
          external_reference: externalReference
        }
      });

      if (!response.results || response.results.length === 0) {
        this.logger.warn(`No payments found for external reference: ${externalReference}`);
        return [];
      }

      return response.results.map(payment => ({
        id: payment.id!.toString(),
        status: payment.status as any,
        status_detail: payment.status_detail!,
        external_reference: payment.external_reference!,
        transaction_amount: payment.transaction_amount!,
        date_created: payment.date_created!,
        date_approved: payment.date_approved || undefined
      }));
    } catch (error) {
      this.logger.error(`Error searching payments by external reference: ${error.message}`, error.stack);
      throw new Error(`Failed to search payments: ${error.message}`);
    }
  }

  mapMercadoPagoStatusToPaymentStatus(mpStatus: string): 'PENDING' | 'PAID' | 'FAIL' {
    switch (mpStatus) {
      case 'approved':
        return 'PAID';
      case 'rejected':
      case 'cancelled':
        return 'FAIL';
      case 'pending':
      case 'in_process':
      default:
        return 'PENDING';
    }
  }
}
