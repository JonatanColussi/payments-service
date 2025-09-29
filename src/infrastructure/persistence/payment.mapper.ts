import { Payment, CPF, Money } from '../../domain';
import { PaymentOrmEntity } from './payment.orm-entity';

export class PaymentMapper {
  static toDomain(ormEntity: PaymentOrmEntity): Payment {
    const cpf = new CPF(ormEntity.cpf);
    const amount = new Money(ormEntity.amount);

    return new Payment(
      ormEntity.id,
      cpf,
      ormEntity.description,
      amount,
      ormEntity.paymentMethod,
      ormEntity.status,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  static toPersistence(domain: Payment): PaymentOrmEntity {
    const ormEntity = new PaymentOrmEntity();
    const plainObject = domain.toPlainObject();

    ormEntity.id = plainObject.id;
    ormEntity.cpf = plainObject.cpf;
    ormEntity.description = plainObject.description;
    ormEntity.amount = plainObject.amount;
    ormEntity.paymentMethod = plainObject.paymentMethod;
    ormEntity.status = plainObject.status;
    ormEntity.createdAt = plainObject.createdAt;
    ormEntity.updatedAt = plainObject.updatedAt;

    return ormEntity;
  }

  static toPartialPersistence(domain: Payment): Partial<PaymentOrmEntity> {
    const plainObject = domain.toPlainObject();

    return {
      id: plainObject.id,
      cpf: plainObject.cpf,
      description: plainObject.description,
      amount: plainObject.amount,
      paymentMethod: plainObject.paymentMethod,
      status: plainObject.status,
      updatedAt: plainObject.updatedAt,
    };
  }
}
