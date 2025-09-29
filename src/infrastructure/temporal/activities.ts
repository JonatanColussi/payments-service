// Activities simples para Temporal.io
import {
  CreatePaymentInput,
  CreateMercadoPagoPreferenceInput,
  UpdatePaymentStatusInput,
  CheckPaymentStatusInput,
  PaymentActivitiesService
} from './services/payment-activities.service';

// Referência global para o service (será configurada no módulo)
let activitiesService: PaymentActivitiesService;

export function setActivitiesService(service: PaymentActivitiesService) {
  activitiesService = service;
}

// Activities exportadas
export async function savePaymentToDatabase(input: CreatePaymentInput): Promise<void> {
  if (!activitiesService) {
    console.log(`Mock: Saving payment ${input.paymentId} to database`);
    return;
  }
  return activitiesService.savePaymentToDatabase(input);
}

export async function createMercadoPagoPreference(input: CreateMercadoPagoPreferenceInput): Promise<string> {
  if (!activitiesService) {
    console.log(`Mock: Creating MercadoPago preference for payment ${input.paymentId}`);
    return 'https://mock-mercadopago-url.com';
  }
  return activitiesService.createMercadoPagoPreference(input);
}

export async function updatePaymentStatus(input: UpdatePaymentStatusInput): Promise<void> {
  if (!activitiesService) {
    console.log(`Mock: Updating payment ${input.paymentId} status to ${input.status}`);
    return;
  }
  return activitiesService.updatePaymentStatus(input);
}

export async function checkPaymentStatus(input: CheckPaymentStatusInput): Promise<any> {
  if (!activitiesService) {
    console.log(`Mock: Checking payment status for ${input.paymentId}`);
    return null;
  }
  return activitiesService.checkPaymentStatus(input);
}

export async function logActivity(message: string): Promise<void> {
  if (!activitiesService) {
    console.log(`[Mock Temporal Activity] ${message}`);
    return;
  }
  return activitiesService.logActivity(message);
}
