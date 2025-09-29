import { Test, TestingModule } from '@nestjs/testing';
import { PaymentActivitiesService, CreatePaymentInput, CreateMercadoPagoPreferenceInput, UpdatePaymentStatusInput, CheckPaymentStatusInput } from './payment-activities.service';
import { IPaymentRepository } from '../../../domain/interfaces';
import { MercadoPagoService } from '../../external/mercadopago.service';
import { Payment, PaymentStatus, PaymentMethod } from '../../../domain/entities';
import { CPF, Money } from '../../../domain/value-objects';
import { MercadoPagoPaymentItem } from '../../../domain/entities/mercadopago-payment.entity';

describe('PaymentActivitiesService', () => {
  let service: PaymentActivitiesService;
  let paymentRepository: jest.Mocked<IPaymentRepository>;
  let mercadoPagoService: jest.Mocked<MercadoPagoService>;

  const mockPaymentRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByFilters: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockMercadoPagoService = {
    createPreference: jest.fn(),
    getPaymentStatus: jest.fn(),
    searchPaymentsByExternalReference: jest.fn(),
    mapMercadoPagoStatusToPaymentStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentActivitiesService,
        {
          provide: IPaymentRepository,
          useValue: mockPaymentRepository,
        },
        {
          provide: MercadoPagoService,
          useValue: mockMercadoPagoService,
        },
      ],
    }).compile();

    service = module.get<PaymentActivitiesService>(PaymentActivitiesService);
    paymentRepository = module.get(IPaymentRepository);
    mercadoPagoService = module.get(MercadoPagoService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('savePaymentToDatabase', () => {
    const mockInput: CreatePaymentInput = {
      paymentId: 'test-payment-123',
      cpf: '12345678909',
      description: 'Test payment',
      amount: 100.00,
      paymentMethod: PaymentMethod.CREDIT_CARD
    };

    it('should save payment to database successfully', async () => {
      // Arrange
      paymentRepository.save.mockResolvedValue(undefined as any);

      // Act
      await service.savePaymentToDatabase(mockInput);

      // Assert
      expect(paymentRepository.save).toHaveBeenCalledWith(expect.any(Payment));
      expect(paymentRepository.save).toHaveBeenCalledTimes(1);

      const savedPayment = paymentRepository.save.mock.calls[0][0] as Payment;
      expect(savedPayment.id).toBe('test-payment-123');
      expect(savedPayment.description).toBe('Test payment');
      expect(savedPayment.amount.getAmount()).toBe(100.00);
      expect(savedPayment.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
    });

    it('should handle invalid CPF', async () => {
      // Arrange
      const invalidInput = {
        ...mockInput,
        cpf: 'invalid-cpf'
      };

      // Act & Assert
      await expect(service.savePaymentToDatabase(invalidInput)).rejects.toThrow('Failed to save payment to database');
    });

    it('should handle repository errors', async () => {
      // Arrange
      paymentRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.savePaymentToDatabase(mockInput)).rejects.toThrow('Failed to save payment to database: Database connection failed');
    });
  });

  describe('createMercadoPagoPreference', () => {
    const mockItems: MercadoPagoPaymentItem[] = [
      {
        title: 'Test Payment',
        description: 'Test payment description',
        quantity: 1,
        unit_price: 100.00,
        currency_id: 'BRL'
      }
    ];

    const mockInput: CreateMercadoPagoPreferenceInput = {
      paymentId: 'test-payment-123',
      items: mockItems,
      payer: {
        email: 'test@test.com',
        name: 'Test User'
      }
    };

    it('should create MercadoPago preference successfully', async () => {
      // Arrange
      const mockPreference = {
        id: 'pref-123456789',
        init_point: 'https://mercadopago.com/checkout/v1/redirect?pref_id=pref-123456789',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref-123456789',
        collector_id: 123456,
        client_id: '654321',
        payment_status: 'pending' as const
      };

      mercadoPagoService.createPreference.mockResolvedValue(mockPreference);

      // Act
      const result = await service.createMercadoPagoPreference(mockInput);

      // Assert
      expect(mercadoPagoService.createPreference).toHaveBeenCalledWith(
        'test-payment-123',
        mockItems,
        mockInput.payer
      );
      expect(result).toBe('https://mercadopago.com/checkout/v1/redirect?pref_id=pref-123456789');
    });

    it('should create preference without payer information', async () => {
      // Arrange
      const inputWithoutPayer = {
        ...mockInput,
        payer: undefined
      };

      const mockPreference = {
        id: 'pref-123456789',
        init_point: 'https://mercadopago.com/checkout/v1/redirect?pref_id=pref-123456789',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref-123456789',
        collector_id: 123456,
        client_id: '654321',
        payment_status: 'pending' as const
      };

      mercadoPagoService.createPreference.mockResolvedValue(mockPreference);

      // Act
      const result = await service.createMercadoPagoPreference(inputWithoutPayer);

      // Assert
      expect(mercadoPagoService.createPreference).toHaveBeenCalledWith(
        'test-payment-123',
        mockItems,
        undefined
      );
      expect(result).toBe('https://mercadopago.com/checkout/v1/redirect?pref_id=pref-123456789');
    });

    it('should handle MercadoPago service errors', async () => {
      // Arrange
      mercadoPagoService.createPreference.mockRejectedValue(new Error('MercadoPago API error'));

      // Act & Assert
      await expect(service.createMercadoPagoPreference(mockInput)).rejects.toThrow('Failed to create MercadoPago preference: MercadoPago API error');
    });
  });

  describe('updatePaymentStatus', () => {
    const mockInput: UpdatePaymentStatusInput = {
      paymentId: 'test-payment-123',
      status: PaymentStatus.PAID,
      mercadoPagoPaymentId: 'mp-payment-456'
    };

    it('should update payment status successfully', async () => {
      // Arrange
      const mockPayment = Payment.create(
        'test-payment-123',
        new CPF('81183047100'),
        'Test payment',
        new Money(100.00),
        PaymentMethod.CREDIT_CARD
      );

      paymentRepository.findById.mockResolvedValue(mockPayment);
      paymentRepository.update.mockResolvedValue(undefined as any);

      // Act
      await service.updatePaymentStatus(mockInput);

      // Assert
      expect(paymentRepository.findById).toHaveBeenCalledWith('test-payment-123');
      expect(paymentRepository.update).toHaveBeenCalledWith(mockPayment);
      expect(mockPayment.status).toBe(PaymentStatus.PAID);
    });

    it('should throw error when payment not found', async () => {
      // Arrange
      paymentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updatePaymentStatus(mockInput)).rejects.toThrow('Failed to update payment status: Payment not found: test-payment-123');
    });

    it('should handle repository update errors', async () => {
      // Arrange
      const mockPayment = Payment.create(
        'test-payment-123',
        new CPF('81183047100'),
        'Test payment',
        new Money(100.00),
        PaymentMethod.CREDIT_CARD
      );

      paymentRepository.findById.mockResolvedValue(mockPayment);
      paymentRepository.update.mockRejectedValue(new Error('Database update failed'));

      // Act & Assert
      await expect(service.updatePaymentStatus(mockInput)).rejects.toThrow('Failed to update payment status: Database update failed');
    });
  });

  describe('checkPaymentStatus', () => {
    const mockInput: CheckPaymentStatusInput = {
      paymentId: 'test-payment-123'
    };

    it('should check payment status successfully', async () => {
      // Arrange
      const mockPayments = [
        {
          id: '123456789',
          status: 'approved' as const,
          status_detail: 'accredited',
          external_reference: 'test-payment-123',
          transaction_amount: 100.00,
          date_created: '2023-01-01T12:00:00Z',
          date_approved: '2023-01-01T12:01:00Z'
        }
      ];

      mercadoPagoService.searchPaymentsByExternalReference.mockResolvedValue(mockPayments);
      mercadoPagoService.mapMercadoPagoStatusToPaymentStatus.mockReturnValue('PAID');

      // Act
      const result = await service.checkPaymentStatus(mockInput);

      // Assert
      expect(mercadoPagoService.searchPaymentsByExternalReference).toHaveBeenCalledWith('test-payment-123');
      expect(mercadoPagoService.mapMercadoPagoStatusToPaymentStatus).toHaveBeenCalledWith('approved');
      expect(result).toBe('PAID');
    });

    it('should return null when no payments found', async () => {
      // Arrange
      mercadoPagoService.searchPaymentsByExternalReference.mockResolvedValue([]);

      // Act
      const result = await service.checkPaymentStatus(mockInput);

      // Assert
      expect(result).toBeNull();
    });

    it('should return latest payment when multiple payments exist', async () => {
      // Arrange
      const mockPayments = [
        {
          id: '123456789',
          status: 'pending' as const,
          status_detail: 'pending_payment',
          external_reference: 'test-payment-123',
          transaction_amount: 100.00,
          date_created: '2023-01-01T11:00:00Z'
        },
        {
          id: '987654321',
          status: 'approved' as const,
          status_detail: 'accredited',
          external_reference: 'test-payment-123',
          transaction_amount: 100.00,
          date_created: '2023-01-01T12:00:00Z', // Mais recente
          date_approved: '2023-01-01T12:01:00Z'
        }
      ];

      mercadoPagoService.searchPaymentsByExternalReference.mockResolvedValue(mockPayments);
      mercadoPagoService.mapMercadoPagoStatusToPaymentStatus.mockReturnValue('PAID');

      // Act
      const result = await service.checkPaymentStatus(mockInput);

      // Assert
      expect(mercadoPagoService.mapMercadoPagoStatusToPaymentStatus).toHaveBeenCalledWith('approved');
      expect(result).toBe('PAID');
    });

    it('should handle MercadoPago service errors', async () => {
      // Arrange
      mercadoPagoService.searchPaymentsByExternalReference.mockRejectedValue(new Error('MercadoPago API error'));

      // Act & Assert
      await expect(service.checkPaymentStatus(mockInput)).rejects.toThrow('Failed to check payment status: MercadoPago API error');
    });
  });

  describe('logActivity', () => {
    it('should log activity message', async () => {
      // Arrange
      const mockLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      };
      (service as any).logger = mockLogger;

      // Act
      await service.logActivity('Test activity message');

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith('[Temporal Activity] Test activity message');
    });
  });
});
