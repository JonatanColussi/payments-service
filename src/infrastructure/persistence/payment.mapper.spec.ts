import { PaymentMapper } from './payment.mapper';
import { PaymentOrmEntity } from './payment.orm-entity';
import { Payment, PaymentMethod, PaymentStatus, CPF, Money } from '../../domain';

describe('PaymentMapper', () => {
  const validCPF = new CPF('33258752036');
  const validAmount = new Money(100.00);
  const createdAt = new Date('2023-01-01T10:00:00Z');
  const updatedAt = new Date('2023-01-01T15:00:00Z');

  describe('toDomain', () => {
    it('should map ORM entity to domain entity correctly', () => {
      // Arrange
      const ormEntity = new PaymentOrmEntity();
      ormEntity.id = 'test-payment-id';
      ormEntity.cpf = '33258752036';
      ormEntity.description = 'Test payment description';
      ormEntity.amount = 100.00;
      ormEntity.paymentMethod = PaymentMethod.PIX;
      ormEntity.status = PaymentStatus.PENDING;
      ormEntity.createdAt = createdAt;
      ormEntity.updatedAt = updatedAt;

      // Act
      const domainEntity = PaymentMapper.toDomain(ormEntity);

      // Assert
      expect(domainEntity).toBeInstanceOf(Payment);
      expect(domainEntity.id).toBe('test-payment-id');
      expect(domainEntity.cpf).toBeInstanceOf(CPF);
      expect(domainEntity.cpf.getValue()).toBe('33258752036');
      expect(domainEntity.description).toBe('Test payment description');
      expect(domainEntity.amount).toBeInstanceOf(Money);
      expect(domainEntity.amount.getAmount()).toBe(100.00);
      expect(domainEntity.paymentMethod).toBe(PaymentMethod.PIX);
      expect(domainEntity.status).toBe(PaymentStatus.PENDING);
      expect(domainEntity.createdAt).toBe(createdAt);
      expect(domainEntity.updatedAt).toBe(updatedAt);
    });

    it('should handle CREDIT_CARD payment method', () => {
      // Arrange
      const ormEntity = new PaymentOrmEntity();
      ormEntity.id = 'credit-card-payment';
      ormEntity.cpf = '33258752036';
      ormEntity.description = 'Credit card payment';
      ormEntity.amount = 250.75;
      ormEntity.paymentMethod = PaymentMethod.CREDIT_CARD;
      ormEntity.status = PaymentStatus.PAID;
      ormEntity.createdAt = createdAt;
      ormEntity.updatedAt = updatedAt;

      // Act
      const domainEntity = PaymentMapper.toDomain(ormEntity);

      // Assert
      expect(domainEntity.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(domainEntity.status).toBe(PaymentStatus.PAID);
      expect(domainEntity.amount.getAmount()).toBe(250.75);
    });

    it('should handle FAIL status', () => {
      // Arrange
      const ormEntity = new PaymentOrmEntity();
      ormEntity.id = 'failed-payment';
      ormEntity.cpf = '33258752036';
      ormEntity.description = 'Failed payment';
      ormEntity.amount = 100.00;
      ormEntity.paymentMethod = PaymentMethod.PIX;
      ormEntity.status = PaymentStatus.FAIL;
      ormEntity.createdAt = createdAt;
      ormEntity.updatedAt = updatedAt;

      // Act
      const domainEntity = PaymentMapper.toDomain(ormEntity);

      // Assert
      expect(domainEntity.status).toBe(PaymentStatus.FAIL);
    });

    it('should handle decimal amounts correctly', () => {
      // Arrange
      const ormEntity = new PaymentOrmEntity();
      ormEntity.id = 'decimal-payment';
      ormEntity.cpf = '33258752036';
      ormEntity.description = 'Decimal amount payment';
      ormEntity.amount = 99.99;
      ormEntity.paymentMethod = PaymentMethod.PIX;
      ormEntity.status = PaymentStatus.PENDING;
      ormEntity.createdAt = createdAt;
      ormEntity.updatedAt = updatedAt;

      // Act
      const domainEntity = PaymentMapper.toDomain(ormEntity);

      // Assert
      expect(domainEntity.amount.getAmount()).toBe(99.99);
    });
  });

  describe('toPersistence', () => {
    it('should map domain entity to ORM entity correctly', () => {
      // Arrange
      const domainEntity = new Payment(
        'test-payment-id',
        validCPF,
        'Test payment description',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING,
        createdAt,
        updatedAt
      );

      // Act
      const ormEntity = PaymentMapper.toPersistence(domainEntity);

      // Assert
      expect(ormEntity).toBeInstanceOf(PaymentOrmEntity);
      expect(ormEntity.id).toBe('test-payment-id');
      expect(ormEntity.cpf).toBe('33258752036');
      expect(ormEntity.description).toBe('Test payment description');
      expect(ormEntity.amount).toBe(100.00);
      expect(ormEntity.paymentMethod).toBe(PaymentMethod.PIX);
      expect(ormEntity.status).toBe(PaymentStatus.PENDING);
      expect(ormEntity.createdAt).toBe(createdAt);
      expect(ormEntity.updatedAt).toBe(updatedAt);
    });

    it('should handle CREDIT_CARD payment method', () => {
      // Arrange
      const domainEntity = new Payment(
        'credit-card-payment',
        new CPF('33258752036'),
        'Credit card payment',
        new Money(250.75),
        PaymentMethod.CREDIT_CARD,
        PaymentStatus.PAID,
        createdAt,
        updatedAt
      );

      // Act
      const ormEntity = PaymentMapper.toPersistence(domainEntity);

      // Assert
      expect(ormEntity.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(ormEntity.status).toBe(PaymentStatus.PAID);
      expect(ormEntity.amount).toBe(250.75);
      expect(ormEntity.cpf).toBe('33258752036');
    });

    it('should handle FAIL status', () => {
      // Arrange
      const domainEntity = new Payment(
        'failed-payment',
        validCPF,
        'Failed payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.FAIL,
        createdAt,
        updatedAt
      );

      // Act
      const ormEntity = PaymentMapper.toPersistence(domainEntity);

      // Assert
      expect(ormEntity.status).toBe(PaymentStatus.FAIL);
    });
  });

  describe('toPartialPersistence', () => {
    it('should map domain entity to partial ORM entity correctly', () => {
      // Arrange
      const domainEntity = new Payment(
        'test-payment-id',
        validCPF,
        'Test payment description',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PENDING,
        createdAt,
        updatedAt
      );

      // Act
      const partialOrmEntity = PaymentMapper.toPartialPersistence(domainEntity);

      // Assert
      expect(partialOrmEntity.id).toBe('test-payment-id');
      expect(partialOrmEntity.cpf).toBe('33258752036');
      expect(partialOrmEntity.description).toBe('Test payment description');
      expect(partialOrmEntity.amount).toBe(100.00);
      expect(partialOrmEntity.paymentMethod).toBe(PaymentMethod.PIX);
      expect(partialOrmEntity.status).toBe(PaymentStatus.PENDING);
      expect(partialOrmEntity.updatedAt).toBe(updatedAt);

      // Should not include createdAt in partial mapping
      expect(partialOrmEntity.createdAt).toBeUndefined();
    });

    it('should handle updated status in partial mapping', () => {
      // Arrange
      const domainEntity = new Payment(
        'updated-payment',
        validCPF,
        'Updated payment',
        validAmount,
        PaymentMethod.PIX,
        PaymentStatus.PAID, // Updated status
        createdAt,
        new Date('2023-01-02T10:00:00Z') // Updated timestamp
      );

      // Act
      const partialOrmEntity = PaymentMapper.toPartialPersistence(domainEntity);

      // Assert
      expect(partialOrmEntity.status).toBe(PaymentStatus.PAID);
      expect(partialOrmEntity.updatedAt).toEqual(new Date('2023-01-02T10:00:00Z'));
    });
  });

  describe('Round-trip mapping', () => {
    it('should preserve data through domain -> ORM -> domain mapping', () => {
      // Arrange
      const originalDomain = new Payment(
        'round-trip-payment',
        validCPF,
        'Round trip test payment',
        new Money(199.99),
        PaymentMethod.CREDIT_CARD,
        PaymentStatus.PAID,
        createdAt,
        updatedAt
      );

      // Act
      const ormEntity = PaymentMapper.toPersistence(originalDomain);
      const mappedBackDomain = PaymentMapper.toDomain(ormEntity);

      // Assert
      expect(mappedBackDomain.id).toBe(originalDomain.id);
      expect(mappedBackDomain.cpf.getValue()).toBe(originalDomain.cpf.getValue());
      expect(mappedBackDomain.description).toBe(originalDomain.description);
      expect(mappedBackDomain.amount.getAmount()).toBe(originalDomain.amount.getAmount());
      expect(mappedBackDomain.paymentMethod).toBe(originalDomain.paymentMethod);
      expect(mappedBackDomain.status).toBe(originalDomain.status);
      expect(mappedBackDomain.createdAt).toBe(originalDomain.createdAt);
      expect(mappedBackDomain.updatedAt).toBe(originalDomain.updatedAt);
    });

    it('should preserve data through ORM -> domain -> ORM mapping', () => {
      // Arrange
      const originalOrm = new PaymentOrmEntity();
      originalOrm.id = 'reverse-round-trip';
      originalOrm.cpf = '12345678909';
      originalOrm.description = 'Reverse round trip test';
      originalOrm.amount = 299.99;
      originalOrm.paymentMethod = PaymentMethod.PIX;
      originalOrm.status = PaymentStatus.FAIL;
      originalOrm.createdAt = createdAt;
      originalOrm.updatedAt = updatedAt;

      // Act
      const domainEntity = PaymentMapper.toDomain(originalOrm);
      const mappedBackOrm = PaymentMapper.toPersistence(domainEntity);

      // Assert
      expect(mappedBackOrm.id).toBe(originalOrm.id);
      expect(mappedBackOrm.cpf).toBe(originalOrm.cpf);
      expect(mappedBackOrm.description).toBe(originalOrm.description);
      expect(mappedBackOrm.amount).toBe(originalOrm.amount);
      expect(mappedBackOrm.paymentMethod).toBe(originalOrm.paymentMethod);
      expect(mappedBackOrm.status).toBe(originalOrm.status);
      expect(mappedBackOrm.createdAt).toBe(originalOrm.createdAt);
      expect(mappedBackOrm.updatedAt).toBe(originalOrm.updatedAt);
    });
  });

  describe('Edge cases', () => {
    it('should handle minimum decimal amounts', () => {
      // Arrange
      const ormEntity = new PaymentOrmEntity();
      ormEntity.id = 'min-amount';
      ormEntity.cpf = '33258752036';
      ormEntity.description = 'Minimum amount';
      ormEntity.amount = 0.01;
      ormEntity.paymentMethod = PaymentMethod.PIX;
      ormEntity.status = PaymentStatus.PENDING;
      ormEntity.createdAt = createdAt;
      ormEntity.updatedAt = updatedAt;

      // Act
      const domainEntity = PaymentMapper.toDomain(ormEntity);

      // Assert
      expect(domainEntity.amount.getAmount()).toBe(0.01);
    });

    it('should handle maximum amounts', () => {
      // Arrange
      const ormEntity = new PaymentOrmEntity();
      ormEntity.id = 'max-amount';
      ormEntity.cpf = '33258752036';
      ormEntity.description = 'Maximum amount';
      ormEntity.amount = 50000.00;
      ormEntity.paymentMethod = PaymentMethod.CREDIT_CARD;
      ormEntity.status = PaymentStatus.PENDING;
      ormEntity.createdAt = createdAt;
      ormEntity.updatedAt = updatedAt;

      // Act
      const domainEntity = PaymentMapper.toDomain(ormEntity);

      // Assert
      expect(domainEntity.amount.getAmount()).toBe(50000.00);
    });

    it('should handle long descriptions', () => {
      // Arrange
      const longDescription = 'a'.repeat(500);
      const ormEntity = new PaymentOrmEntity();
      ormEntity.id = 'long-description';
      ormEntity.cpf = '33258752036';
      ormEntity.description = longDescription;
      ormEntity.amount = 100.00;
      ormEntity.paymentMethod = PaymentMethod.PIX;
      ormEntity.status = PaymentStatus.PENDING;
      ormEntity.createdAt = createdAt;
      ormEntity.updatedAt = updatedAt;

      // Act
      const domainEntity = PaymentMapper.toDomain(ormEntity);

      // Assert
      expect(domainEntity.description).toBe(longDescription);
      expect(domainEntity.description.length).toBe(500);
    });
  });
});
