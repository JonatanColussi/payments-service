import { PaymentStatus } from '../../domain/entities';

export interface CreditCardPaymentWorkflowInput {
  paymentId: string;
  cpf: string;
  description: string;
  amount: number;
  payer?: {
    email?: string;
    name?: string;
  };
}

export interface PaymentWorkflowResult {
  workflowId: string;
  runId: string;
  preferenceUrl?: string;
}

export interface PaymentWorkflowState {
  paymentId: string;
  status: PaymentStatus;
  mercadoPagoPreferenceUrl?: string;
  mercadoPagoPaymentId?: string;
  error?: string;
  lastUpdated: Date;
}

export abstract class IPaymentWorkflowService {
  abstract startCreditCardPaymentWorkflow(input: CreditCardPaymentWorkflowInput): Promise<PaymentWorkflowResult>;
  abstract notifyPaymentStatus(paymentId: string, status: PaymentStatus, mercadoPagoPaymentId?: string): Promise<void>;
  abstract cancelPayment(paymentId: string): Promise<void>;
  abstract getPaymentWorkflowState(paymentId: string): Promise<PaymentWorkflowState | null>;
  abstract listActivePaymentWorkflows(): Promise<PaymentWorkflowState[]>;
}