import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRepository } from './payment.repository';
import { PaymentOrmEntity } from '../persistence/payment.orm-entity';
import { Payment, PaymentMethod, PaymentStatus, CPF, Money } from '../../domain';

describe('PaymentRepository', () => {
  let repository: PaymentRepository;
  let ormRepository: jest.Mocked<Repository<PaymentOrmEntity>>;

  const mockOrmRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRepository,
        {
          provide: getRepositoryToken(PaymentOrmEntity),
          useValue: mockOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<PaymentRepository>(PaymentRepository);
    ormRepository = module.get(getRepositoryToken(PaymentOrmEntity));

    // Reset mocks
    jest.clearAllMocks();
  });

  const createMockOrmEntity = (overrides: Partial<PaymentOrmEntity> = {}): PaymentOrmEntity => {
    const entity = new PaymentOrmEntity();
    entity.id = 'test-payment-id';
    entity.cpf = '33258752036';
    entity.description = 'Test payment';
    entity.amount = 100.00;
    entity.paymentMethod = PaymentMethod.PIX;
    entity.status = PaymentStatus.PENDING;
    entity.createdAt = new Date('2023-01-01T10:00:00Z');
    entity.updatedAt = new Date('2023-01-01T10:00:00Z');

    return Object.assign(entity, overrides);
  };

  const createMockDomainEntity = (overrides: Partial<any> = {}): Payment => {
    const defaults = {
      id: 'test-payment-id',
      cpf: new CPF('33258752036'),
      description: 'Test payment',
      amount: new Money(100.00),
      paymentMethod: PaymentMethod.PIX,
      status: PaymentStatus.PENDING,
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:00:00Z'),
    };

    const merged = { ...defaults, ...overrides };

    return new Payment(
      merged.id,
      merged.cpf,
      merged.description,
      merged.amount,
      merged.paymentMethod,
      merged.status,
      merged.createdAt,
      merged.updatedAt
    );
  };

  describe('save', () => {
    it('should save payment and return domain entity', async () => {
      // Arrange
      const domainPayment = createMockDomainEntity();
      const savedOrmEntity = createMockOrmEntity();

      ormRepository.save.mockResolvedValue(savedOrmEntity);

      // Act
      const result = await repository.save(domainPayment);

      // Assert
      expect(ormRepository.save).toHaveBeenCalledTimes(1);
      expect(ormRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-payment-id',
        cpf: '33258752036',
        description: 'Test payment',
        amount: 100.00,
        paymentMethod: PaymentMethod.PIX,
        status: PaymentStatus.PENDING,
      }));

      expect(result).toBeInstanceOf(Payment);
      expect(result.id).toBe('test-payment-id');
      expect(result.cpf.getValue()).toBe('33258752036');
    });

    it('should handle credit card payments', async () => {
      // Arrange
      const domainPayment = createMockDomainEntity({
        cpf: new CPF('33258752036'),
        amount: new Money(250.75),
        paymentMethod: PaymentMethod.CREDIT_CARD,
      });

      const savedOrmEntity = createMockOrmEntity({
        cpf: '33258752036',
        amount: 250.75,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      });

      ormRepository.save.mockResolvedValue(savedOrmEntity);

      // Act
      const result = await repository.save(domainPayment);

      // Assert
      expect(result.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(result.amount.getAmount()).toBe(250.75);
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const domainPayment = createMockDomainEntity();
      const error = new Error('Database save failed');

      ormRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.save(domainPayment)).rejects.toThrow('Database save failed');
    });
  });

  describe('findById', () => {
    it('should find payment by ID and return domain entity', async () => {
      // Arrange
      const ormEntity = createMockOrmEntity();
      ormRepository.findOne.mockResolvedValue(ormEntity);

      // Act
      const result = await repository.findById('test-payment-id');

      // Assert
      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-payment-id' }
      });

      expect(result).toBeInstanceOf(Payment);
      expect(result!.id).toBe('test-payment-id');
    });

    it('should return null when payment not found', async () => {
      // Arrange
      ormRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle repository find errors', async () => {
      // Arrange
      const error = new Error('Database query failed');
      ormRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findById('test-id')).rejects.toThrow('Database query failed');
    });
  });

  describe('findByCpf', () => {
    it('should find payments by CPF and return domain entities', async () => {
      // Arrange
      const cpf = '33258752036';
      const ormEntities = [
        createMockOrmEntity({ id: 'payment-1' }),
        createMockOrmEntity({ id: 'payment-2' }),
      ];

      ormRepository.find.mockResolvedValue(ormEntities);

      // Act
      const result = await repository.findByCpf(cpf);

      // Assert
      expect(ormRepository.find).toHaveBeenCalledWith({
        where: { cpf },
        order: { createdAt: 'DESC' },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Payment);
      expect(result[0].id).toBe('payment-1');
      expect(result[1].id).toBe('payment-2');
    });

    it('should return empty array when no payments found', async () => {
      // Arrange
      ormRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.findByCpf('33258752036');

      // Assert
      expect(result).toEqual([]);
    });

    it('should order results by createdAt DESC', async () => {
      // Arrange
      const cpf = '33258752036';
      ormRepository.find.mockResolvedValue([]);

      // Act
      await repository.findByCpf(cpf);

      // Assert
      expect(ormRepository.find).toHaveBeenCalledWith({
        where: { cpf },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByStatus', () => {
    it('should find payments by status and return domain entities', async () => {
      // Arrange
      const status = PaymentStatus.PENDING;
      const ormEntities = [
        createMockOrmEntity({ id: 'pending-1', status: PaymentStatus.PENDING }),
        createMockOrmEntity({ id: 'pending-2', status: PaymentStatus.PENDING }),
      ];

      ormRepository.find.mockResolvedValue(ormEntities);

      // Act
      const result = await repository.findByStatus(status);

      // Assert
      expect(ormRepository.find).toHaveBeenCalledWith({
        where: { status: PaymentStatus.PENDING },
        order: { createdAt: 'DESC' },
      });

      expect(result).toHaveLength(2);
      expect(result.every(p => p.status === PaymentStatus.PENDING)).toBe(true);
    });

    it('should handle PAID status', async () => {
      // Arrange
      const status = PaymentStatus.PAID;
      const ormEntities = [
        createMockOrmEntity({ status: PaymentStatus.PAID }),
      ];

      ormRepository.find.mockResolvedValue(ormEntities);

      // Act
      const result = await repository.findByStatus(status);

      // Assert
      expect(ormRepository.find).toHaveBeenCalledWith({
        where: { status: PaymentStatus.PAID },
        order: { createdAt: 'DESC' },
      });

      expect(result[0].status).toBe(PaymentStatus.PAID);
    });

    it('should handle FAIL status', async () => {
      // Arrange
      const status = PaymentStatus.FAIL;
      const ormEntities = [
        createMockOrmEntity({ status: PaymentStatus.FAIL }),
      ];

      ormRepository.find.mockResolvedValue(ormEntities);

      // Act
      const result = await repository.findByStatus(status);

      // Assert
      expect(result[0].status).toBe(PaymentStatus.FAIL);
    });
  });

  describe('findByCpfAndStatus', () => {
    it('should find payments by CPF and status', async () => {
      // Arrange
      const cpf = '33258752036';
      const status = PaymentStatus.PAID;
      const ormEntities = [
        createMockOrmEntity({
          id: 'filtered-payment',
          cpf,
          status: PaymentStatus.PAID
        }),
      ];

      ormRepository.find.mockResolvedValue(ormEntities);

      // Act
      const result = await repository.findByCpfAndStatus(cpf, status);

      // Assert
      expect(ormRepository.find).toHaveBeenCalledWith({
        where: { cpf, status: PaymentStatus.PAID },
        order: { createdAt: 'DESC' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].cpf.getValue()).toBe(cpf);
      expect(result[0].status).toBe(PaymentStatus.PAID);
    });

    it('should return empty array when no matching payments found', async () => {
      // Arrange
      ormRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.findByCpfAndStatus('33258752036', PaymentStatus.PAID);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update payment and return updated domain entity', async () => {
      // Arrange
      const domainPayment = createMockDomainEntity({
        status: PaymentStatus.PAID,
        updatedAt: new Date('2023-01-02T10:00:00Z'),
      });

      const updatedOrmEntity = createMockOrmEntity({
        status: PaymentStatus.PAID,
        updatedAt: new Date('2023-01-02T10:00:00Z'),
      });

      ormRepository.update.mockResolvedValue({ affected: 1 } as any);
      ormRepository.findOne.mockResolvedValue(updatedOrmEntity);

      // Act
      const result = await repository.update(domainPayment);

      // Assert
      expect(ormRepository.update).toHaveBeenCalledWith(
        'test-payment-id',
        expect.objectContaining({
          status: PaymentStatus.PAID,
          updatedAt: new Date('2023-01-02T10:00:00Z'),
        })
      );

      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-payment-id' }
      });

      expect(result).toBeInstanceOf(Payment);
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should throw error when payment not found after update', async () => {
      // Arrange
      const domainPayment = createMockDomainEntity();

      ormRepository.update.mockResolvedValue({ affected: 1 } as any);
      ormRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(repository.update(domainPayment)).rejects.toThrow(
        'Payment with ID test-payment-id not found after update'
      );
    });

    it('should handle update repository errors', async () => {
      // Arrange
      const domainPayment = createMockDomainEntity();
      const error = new Error('Database update failed');

      ormRepository.update.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.update(domainPayment)).rejects.toThrow('Database update failed');
    });
  });

  describe('delete', () => {
    it('should delete payment by ID', async () => {
      // Arrange
      const paymentId = 'payment-to-delete';
      ormRepository.delete.mockResolvedValue({ affected: 1 } as any);

      // Act
      await repository.delete(paymentId);

      // Assert
      expect(ormRepository.delete).toHaveBeenCalledWith(paymentId);
      expect(ormRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle delete repository errors', async () => {
      // Arrange
      const paymentId = 'payment-to-delete';
      const error = new Error('Database delete failed');

      ormRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.delete(paymentId)).rejects.toThrow('Database delete failed');
    });

    it('should complete successfully even if payment does not exist', async () => {
      // Arrange
      const paymentId = 'non-existent-payment';
      ormRepository.delete.mockResolvedValue({ affected: 0 } as any);

      // Act & Assert
      await expect(repository.delete(paymentId)).resolves.toBeUndefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex queries with multiple results', async () => {
      // Arrange
      const cpf = '33258752036';
      const ormEntities = [
        createMockOrmEntity({
          id: 'payment-1',
          status: PaymentStatus.PAID,
          paymentMethod: PaymentMethod.PIX,
          createdAt: new Date('2023-01-03T10:00:00Z'),
        }),
        createMockOrmEntity({
          id: 'payment-2',
          status: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.CREDIT_CARD,
          createdAt: new Date('2023-01-02T10:00:00Z'),
        }),
        createMockOrmEntity({
          id: 'payment-3',
          status: PaymentStatus.FAIL,
          paymentMethod: PaymentMethod.PIX,
          createdAt: new Date('2023-01-01T10:00:00Z'),
        }),
      ];

      ormRepository.find.mockResolvedValue(ormEntities);

      // Act
      const result = await repository.findByCpf(cpf);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('payment-1');
      expect(result[1].id).toBe('payment-2');
      expect(result[2].id).toBe('payment-3');

      // Verify all results have correct CPF
      expect(result.every(p => p.cpf.getValue() === cpf)).toBe(true);
    });

    it('should handle edge case amounts and descriptions', async () => {
      // Arrange
      const specialPayment = createMockDomainEntity({
        description: 'Special chars: áéíóú ção #@$%',
        amount: new Money(0.01), // Minimum amount
      });

      const savedOrmEntity = createMockOrmEntity({
        description: 'Special chars: áéíóú ção #@$%',
        amount: 0.01,
      });

      ormRepository.save.mockResolvedValue(savedOrmEntity);

      // Act
      const result = await repository.save(specialPayment);

      // Assert
      expect(result.description).toBe('Special chars: áéíóú ção #@$%');
      expect(result.amount.getAmount()).toBe(0.01);
    });
  });
});
