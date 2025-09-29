import { Test, TestingModule } from '@nestjs/testing';
import { GetPaymentsByFiltersHandler } from './get-payments-by-filters.handler';
import { GetPaymentsByFiltersQuery } from '../queries';
import { IPaymentRepository } from '../../domain/interfaces';
import { Payment, PaymentMethod, PaymentStatus, CPF, Money } from '../../domain';
import { PaymentResponseDto } from '../dtos';

describe('GetPaymentsByFiltersHandler', () => {
  let handler: GetPaymentsByFiltersHandler;
  let paymentRepository: jest.Mocked<IPaymentRepository>;

  const mockPaymentRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByCpf: jest.fn(),
    findByStatus: jest.fn(),
    findByCpfAndStatus: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPaymentsByFiltersHandler,
        {
          provide: 'IPaymentRepository',
          useValue: mockPaymentRepository,
        },
      ],
    }).compile();

    handler = module.get<GetPaymentsByFiltersHandler>(GetPaymentsByFiltersHandler);
    paymentRepository = module.get('IPaymentRepository');

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCPF1 = new CPF('33258752036');
    const validCPF2 = new CPF('33258752036');
    const validAmount = new Money(100.00);
    const createdAt = new Date('2023-01-01');
    const updatedAt = new Date('2023-01-02');

    const createMockPayment = (id: string, cpf: CPF, status: PaymentStatus, method: PaymentMethod = PaymentMethod.PIX) => {
      return new Payment(
        id,
        cpf,
        `Payment ${id}`,
        validAmount,
        method,
        status,
        createdAt,
        updatedAt
      );
    };

    it('should return payments filtered by CPF and status', async () => {
      // Arrange
      const cpf = '33258752036';
      const status = PaymentStatus.PENDING;
      const payments = [
        createMockPayment('1', validCPF1, PaymentStatus.PENDING),
        createMockPayment('2', validCPF1, PaymentStatus.PENDING),
      ];

      const query = new GetPaymentsByFiltersQuery({ cpf, status });
      paymentRepository.findByCpfAndStatus.mockResolvedValue(payments);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(paymentRepository.findByCpfAndStatus).toHaveBeenCalledWith(cpf, status);
      expect(paymentRepository.findByCpfAndStatus).toHaveBeenCalledTimes(1);
      expect(paymentRepository.findByCpf).not.toHaveBeenCalled();
      expect(paymentRepository.findByStatus).not.toHaveBeenCalled();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(PaymentResponseDto);
      expect(result[0].id).toBe('1');
      expect(result[0].cpf).toBe(cpf);
      expect(result[0].status).toBe(PaymentStatus.PENDING);
    });

    it('should return payments filtered by CPF only', async () => {
      // Arrange
      const cpf = '33258752036';
      const payments = [
        createMockPayment('1', validCPF1, PaymentStatus.PENDING),
        createMockPayment('2', validCPF1, PaymentStatus.PAID),
        createMockPayment('3', validCPF1, PaymentStatus.FAIL),
      ];

      const query = new GetPaymentsByFiltersQuery({ cpf });
      paymentRepository.findByCpf.mockResolvedValue(payments);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(paymentRepository.findByCpf).toHaveBeenCalledWith(cpf);
      expect(paymentRepository.findByCpf).toHaveBeenCalledTimes(1);
      expect(paymentRepository.findByCpfAndStatus).not.toHaveBeenCalled();
      expect(paymentRepository.findByStatus).not.toHaveBeenCalled();

      expect(result).toHaveLength(3);
      expect(result.map(p => p.status)).toEqual([
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        PaymentStatus.FAIL
      ]);
    });

    it('should return payments filtered by status only', async () => {
      // Arrange
      const status = PaymentStatus.PAID;
      const payments = [
        createMockPayment('1', validCPF1, PaymentStatus.PAID),
        createMockPayment('2', validCPF2, PaymentStatus.PAID),
      ];

      const query = new GetPaymentsByFiltersQuery({ status });
      paymentRepository.findByStatus.mockResolvedValue(payments);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(paymentRepository.findByStatus).toHaveBeenCalledWith(status);
      expect(paymentRepository.findByStatus).toHaveBeenCalledTimes(1);
      expect(paymentRepository.findByCpf).not.toHaveBeenCalled();
      expect(paymentRepository.findByCpfAndStatus).not.toHaveBeenCalled();

      expect(result).toHaveLength(2);
      expect(result.every(p => p.status === PaymentStatus.PAID)).toBe(true);
    });

    it('should return PENDING payments when no filters provided', async () => {
      // Arrange
      const payments = [
        createMockPayment('1', validCPF1, PaymentStatus.PENDING),
        createMockPayment('2', validCPF2, PaymentStatus.PENDING),
      ];

      const query = new GetPaymentsByFiltersQuery({});
      paymentRepository.findByStatus.mockResolvedValue(payments);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(paymentRepository.findByStatus).toHaveBeenCalledWith(PaymentStatus.PENDING);
      expect(paymentRepository.findByStatus).toHaveBeenCalledTimes(1);

      expect(result).toHaveLength(2);
      expect(result.every(p => p.status === PaymentStatus.PENDING)).toBe(true);
    });

    it('should return empty array when no payments found', async () => {
      // Arrange
      const query = new GetPaymentsByFiltersQuery({ cpf: '33258752036' });
      paymentRepository.findByCpf.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle different payment methods in results', async () => {
      // Arrange
      const cpf = '33258752036';
      const payments = [
        createMockPayment('1', validCPF1, PaymentStatus.PENDING, PaymentMethod.PIX),
        createMockPayment('2', validCPF1, PaymentStatus.PENDING, PaymentMethod.CREDIT_CARD),
      ];

      const query = new GetPaymentsByFiltersQuery({ cpf });
      paymentRepository.findByCpf.mockResolvedValue(payments);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result[0].paymentMethod).toBe(PaymentMethod.PIX);
      expect(result[1].paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const query = new GetPaymentsByFiltersQuery({ cpf: '33258752036' });
      const repositoryError = new Error('Database connection failed');

      paymentRepository.findByCpf.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow('Database connection failed');
    });

    it('should map payment entities to DTOs correctly', async () => {
      // Arrange
      const cpf = '33258752036';
      const amount = new Money(250.75);
      const description = 'Specific test payment';

      const payment = new Payment(
        'test-id',
        validCPF2,
        description,
        amount,
        PaymentMethod.CREDIT_CARD,
        PaymentStatus.PAID,
        createdAt,
        updatedAt
      );

      const query = new GetPaymentsByFiltersQuery({ cpf });
      paymentRepository.findByCpf.mockResolvedValue([payment]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-id');
      expect(result[0].cpf).toBe(cpf);
      expect(result[0].description).toBe(description);
      expect(result[0].amount).toBe(250.75);
      expect(result[0].paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(result[0].status).toBe(PaymentStatus.PAID);
      expect(result[0].createdAt).toBe(createdAt);
      expect(result[0].updatedAt).toBe(updatedAt);
    });

    it('should filter by FAIL status correctly', async () => {
      // Arrange
      const status = PaymentStatus.FAIL;
      const payments = [
        createMockPayment('1', validCPF1, PaymentStatus.FAIL),
      ];

      const query = new GetPaymentsByFiltersQuery({ status });
      paymentRepository.findByStatus.mockResolvedValue(payments);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(paymentRepository.findByStatus).toHaveBeenCalledWith(PaymentStatus.FAIL);
      expect(result[0].status).toBe(PaymentStatus.FAIL);
    });

    it('should handle multiple payments with same CPF and different statuses', async () => {
      // Arrange
      const cpf = '33258752036';
      const status = PaymentStatus.PAID;
      const payments = [
        createMockPayment('1', validCPF1, PaymentStatus.PAID),
        createMockPayment('2', validCPF1, PaymentStatus.PAID),
        createMockPayment('3', validCPF1, PaymentStatus.PAID),
      ];

      const query = new GetPaymentsByFiltersQuery({ cpf, status });
      paymentRepository.findByCpfAndStatus.mockResolvedValue(payments);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.every(p => p.cpf === cpf && p.status === PaymentStatus.PAID)).toBe(true);
    });

    it('should handle large result sets', async () => {
      // Arrange
      const payments = Array.from({ length: 100 }, (_, i) =>
        createMockPayment(`payment-${i}`, validCPF1, PaymentStatus.PENDING)
      );

      const query = new GetPaymentsByFiltersQuery({});
      paymentRepository.findByStatus.mockResolvedValue(payments);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(100);
      expect(result.every(p => p.status === PaymentStatus.PENDING)).toBe(true);
    });
  });
});
