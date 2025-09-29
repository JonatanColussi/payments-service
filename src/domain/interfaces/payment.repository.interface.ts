import { Payment, PaymentStatus } from '../entities';

export interface PaymentFilters {
  cpf?: string;
  status?: PaymentStatus;
}

export abstract class IPaymentRepository {
  abstract save(payment: Payment): Promise<Payment>;
  abstract findById(id: string): Promise<Payment | null>;
  abstract findByFilters(filters: PaymentFilters): Promise<Payment[]>;
  abstract update(payment: Payment): Promise<Payment>;
  abstract delete(id: string): Promise<void>;

  // Método helper que pode ser usado por implementações concretas
  protected buildFiltersCondition(filters: PaymentFilters): Record<string, any> {
    const { cpf, status } = filters;
    const whereCondition: Record<string, any> = {};

    if (cpf) {
      whereCondition.cpf = cpf;
    }

    if (status) {
      whereCondition.status = status;
    }

    return whereCondition;
  }

  // Método helper para validar filtros
  protected validateFilters(filters: PaymentFilters): void {
    if (filters.cpf && (filters.cpf.length !== 11 || !/^\d+$/.test(filters.cpf))) {
      throw new Error('CPF deve conter exatamente 11 dígitos numéricos');
    }

    if (filters.status && !Object.values(PaymentStatus).includes(filters.status)) {
      throw new Error('Status de pagamento inválido');
    }
  }
}
