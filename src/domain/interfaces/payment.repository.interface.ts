import { Payment } from '../entities';

export interface IPaymentRepository {
  save(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByCpf(cpf: string): Promise<Payment[]>;
  findByStatus(status: string): Promise<Payment[]>;
  findByCpfAndStatus(cpf: string, status: string): Promise<Payment[]>;
  update(payment: Payment): Promise<Payment>;
  delete(id: string): Promise<void>;
}