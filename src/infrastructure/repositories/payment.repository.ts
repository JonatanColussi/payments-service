import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../domain';
import { IPaymentRepository, PaymentFilters } from '../../domain/interfaces';
import { PaymentOrmEntity } from '../persistence/payment.orm-entity';
import { PaymentMapper } from '../persistence/payment.mapper';

@Injectable()
export class PaymentRepository extends IPaymentRepository {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly ormRepository: Repository<PaymentOrmEntity>,
  ) {
    super();
  }

  async save(payment: Payment): Promise<Payment> {
    const ormEntity = PaymentMapper.toPersistence(payment);
    const savedEntity = await this.ormRepository.save(ormEntity);
    return PaymentMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Payment | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? PaymentMapper.toDomain(ormEntity) : null;
  }

  async findByCpf(cpf: string): Promise<Payment[]> {
    const ormEntities = await this.ormRepository.find({
      where: { cpf },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(PaymentMapper.toDomain);
  }

  async findByStatus(status: string): Promise<Payment[]> {
    const ormEntities = await this.ormRepository.find({
      where: { status: status as any },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(PaymentMapper.toDomain);
  }

  async findByCpfAndStatus(cpf: string, status: string): Promise<Payment[]> {
    const ormEntities = await this.ormRepository.find({
      where: { cpf, status: status as any },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(PaymentMapper.toDomain);
  }

  async findByFilters(filters: PaymentFilters): Promise<Payment[]> {
    // Validar filtros usando método da classe abstrata
    this.validateFilters(filters);

    // Construir condição usando método helper da classe abstrata
    const whereCondition = this.buildFiltersCondition(filters);

    const ormEntities = await this.ormRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });

    return ormEntities.map(PaymentMapper.toDomain);
  }

  async update(payment: Payment): Promise<Payment> {
    const updateData = PaymentMapper.toPartialPersistence(payment);
    await this.ormRepository.update(payment.id, updateData);

    const updatedEntity = await this.ormRepository.findOne({
      where: { id: payment.id }
    });

    if (!updatedEntity) {
      throw new Error(`Payment with ID ${payment.id} not found after update`);
    }

    return PaymentMapper.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
