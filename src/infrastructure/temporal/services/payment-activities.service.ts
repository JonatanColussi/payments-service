import { Injectable, Logger } from '@nestjs/common';
import { IPaymentRepository } from '../../../domain/interfaces';
import { MercadoPagoService } from '../../external/mercadopago.service';
import { Payment, PaymentStatus, PaymentMethod } from '../../../domain/entities';
import { CPF, Money } from '../../../domain/value-objects';

export interface CreatePaymentInput {
  paymentId: string;
  cpf: string;
  description: string;
  amount: number;
  paymentMethod: string;
}

export interface UpdatePaymentStatusInput {
  paymentId: string;
  status: PaymentStatus;
  mercadoPagoPaymentId?: string;
}

export interface CheckPaymentStatusInput {
  paymentId: string;
}

@Injectable()
export class PaymentActivitiesService {
  private readonly logger = new Logger(PaymentActivitiesService.name);

  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async savePaymentToDatabase(input: CreatePaymentInput): Promise<void> {
    try {
      this.logger.log(`Saving payment ${input.paymentId} to database`);

      // Criar entidade Payment
      const cpfVO = new CPF(input.cpf);
      const amountVO = new Money(input.amount);
      const paymentMethod = input.paymentMethod as PaymentMethod;

      const payment = Payment.create(
        input.paymentId,
        cpfVO,
        input.description,
        amountVO,
        paymentMethod
      );

      await this.paymentRepository.save(payment);

      this.logger.log(`Payment ${input.paymentId} saved to database with PENDING status`);
    } catch (error) {
      this.logger.error(`Failed to save payment to database: ${error.message}`, error.stack);
      throw new Error(`Failed to save payment to database: ${error.message}`);
    }
  }


  async updatePaymentStatus(input: UpdatePaymentStatusInput): Promise<void> {
    try {
      this.logger.log(`Updating payment ${input.paymentId} status to ${input.status}`);

      const payment = await this.paymentRepository.findById(input.paymentId);
      if (!payment) {
        throw new Error(`Payment not found: ${input.paymentId}`);
      }

      payment.updateStatus(input.status);
      await this.paymentRepository.update(payment);

      this.logger.log(`Payment ${input.paymentId} status updated to ${input.status}`);
    } catch (error) {
      this.logger.error(`Failed to update payment status: ${error.message}`, error.stack);
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  async checkPaymentStatus(input: CheckPaymentStatusInput): Promise<PaymentStatus | null> {
    try {
      this.logger.log(`Checking payment status for ${input.paymentId}`);

      // Buscar pagamentos pelo external_reference (nosso paymentId)
      const payments = await this.mercadoPagoService.searchPaymentsByExternalReference(input.paymentId);

      if (payments.length === 0) {
        this.logger.warn(`No payments found for ${input.paymentId}`);
        return null;
      }

      // Pegar o pagamento mais recente
      const latestPayment = payments.sort((a, b) =>
        new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
      )[0];

      const mappedStatus = this.mercadoPagoService.mapMercadoPagoStatusToPaymentStatus(latestPayment.status);

      this.logger.log(`Payment ${input.paymentId} status checked: ${mappedStatus}`);

      return mappedStatus as PaymentStatus;
    } catch (error) {
      this.logger.error(`Failed to check payment status: ${error.message}`, error.stack);
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }

  async logActivity(message: string): Promise<void> {
    this.logger.log(`[Temporal Activity] ${message}`);
  }
}
