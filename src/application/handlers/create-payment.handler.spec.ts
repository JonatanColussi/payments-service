import { Test, TestingModule } from '@nestjs/testing';
import { EventPublisher } from '@nestjs/cqrs';
import { CreatePaymentHandler } from './create-payment.handler';
import { CreatePaymentCommand } from '../commands';
import { IPaymentRepository } from '../../domain/interfaces';
import { CPF, Money, Payment, PaymentMethod, PaymentStatus } from '../../domain';
import { PaymentResponseDto } from '../dtos';
import { IPaymentWorkflowService } from '../interfaces/payment-workflow.interface';
import { MercadoPagoService } from '../../infrastructure/external/mercadopago.service';

describe('CreatePaymentHandler', () => {
  let handler: CreatePaymentHandler;
  let paymentRepository: jest.Mocked<IPaymentRepository>;
  let eventPublisher: jest.Mocked<EventPublisher>;

  const mockPaymentRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByFilters: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockEventPublisher = {
    mergeObjectContext: jest.fn(),
  };

  const mockPaymentModel = {
    commit: jest.fn(),
  };

  const mockTemporalWorkflowService = {
    startCreditCardPaymentWorkflow: jest.fn(),
    notifyPaymentStatus: jest.fn(),
    cancelPayment: jest.fn(),
    getPaymentWorkflowState: jest.fn(),
    listActivePaymentWorkflows: jest.fn(),
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
        CreatePaymentHandler,
        {
          provide: IPaymentRepository,
          useValue: mockPaymentRepository,
        },
        {
          provide: EventPublisher,
          useValue: mockEventPublisher,
        },
        {
          provide: IPaymentWorkflowService,
          useValue: mockTemporalWorkflowService,
        },
        {
          provide: MercadoPagoService,
          useValue: mockMercadoPagoService,
        },
      ],
    }).compile();

    handler = module.get<CreatePaymentHandler>(CreatePaymentHandler);
    paymentRepository = module.get(IPaymentRepository);
    eventPublisher = module.get(EventPublisher);

    // Reset mocks
    jest.clearAllMocks();
    mockEventPublisher.mergeObjectContext.mockReturnValue(mockPaymentModel);
    
    // Setup default mock return values
    mockTemporalWorkflowService.startCreditCardPaymentWorkflow.mockResolvedValue({
      workflowId: 'test-workflow-id',
      runId: 'test-run-id',
      preferenceUrl: 'https://mercadopago.com/test-preference'
    });
  });

  describe('execute', () => {
    const validCommand = new CreatePaymentCommand(
      '33258752036',
      'Test payment description',
      100.00,
      PaymentMethod.PIX
    );

    it('should successfully create a payment', async () => {
      // Arrange
      const cpfVO = new CPF(validCommand.cpf);
      const amountVO = new Money(validCommand.amount);

      const savedPayment = Payment.create(
        'test-id',
        cpfVO,
        validCommand.description,
        amountVO,
        validCommand.paymentMethod
      );

      paymentRepository.save.mockResolvedValue(savedPayment);

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(paymentRepository.save).toHaveBeenCalledTimes(1);
      expect(paymentRepository.save).toHaveBeenCalledWith(expect.any(Payment));

      expect(eventPublisher.mergeObjectContext).toHaveBeenCalledWith(savedPayment);
      expect(mockPaymentModel.commit).toHaveBeenCalledTimes(1);

      expect(result).toBeInstanceOf(PaymentResponseDto);
      expect(result.cpf).toBe('33258752036');
      expect(result.description).toBe('Test payment description');
      expect(result.amount).toBe(100.00);
      expect(result.paymentMethod).toBe(PaymentMethod.PIX);
      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should validate CPF and throw error for invalid CPF', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '12345678901', // Invalid CPF
        'Test payment description',
        100.00,
        PaymentMethod.PIX
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Invalid CPF format');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should validate payment amount and throw error for amount below minimum', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '33258752036',
        'Test payment description',
        0, // Below minimum for PIX
        PaymentMethod.PIX
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Payment amount must be at least');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should validate payment amount and throw error for amount above maximum', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '33258752036',
        'Test payment description',
        500001.00, // Above maximum for PIX
        PaymentMethod.PIX
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Payment amount cannot exceed');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should validate description and throw error for empty description', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '33258752036',
        '', // Empty description
        100.00,
        PaymentMethod.PIX
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Payment description is required');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should validate description and throw error for description too long', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '33258752036',
        'a'.repeat(501), // Too long description
        100.00,
        PaymentMethod.PIX
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Payment description cannot exceed 500 characters');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should validate payment method and throw error for invalid method', async () => {
      // Arrange
      const invalidCommand = new CreatePaymentCommand(
        '33258752036',
        'Test payment description',
        100.00,
        'INVALID_METHOD' as PaymentMethod
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow('Invalid payment method');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should handle credit card payments with correct validation', async () => {
      // Arrange
      const creditCardCommand = new CreatePaymentCommand(
        '33258752036',
        'Credit card payment',
        1000.00,
        PaymentMethod.CREDIT_CARD
      );

      const mockPreference = {
        id: 'pref-123',
        init_point: 'https://mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
        sandbox_init_point: 'https://sandbox.mercadopago.com',
        collector_id: 123,
        client_id: '456',
        payment_status: 'pending' as const
      };

      mockMercadoPagoService.createPreference.mockResolvedValue(mockPreference);
      mockTemporalWorkflowService.startCreditCardPaymentWorkflow.mockResolvedValue({
        workflowId: 'workflow-123',
        runId: 'run-123'
      });

      // Act
      const result = await handler.execute(creditCardCommand);

      // Assert
      expect(result.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(result.status).toBe('PENDING');
      expect(result.preferenceUrl).toBe('https://mercadopago.com/checkout/v1/redirect?pref_id=pref-123');
      expect(mockMercadoPagoService.createPreference).toHaveBeenCalledWith(
        expect.any(String),
        [
          {
            title: 'Credit card payment',
            description: 'Credit card payment',
            quantity: 1,
            unit_price: 1000.00,
            currency_id: 'BRL'
          }
        ],
        {
          email: undefined,
          name: undefined
        }
      );
      expect(mockTemporalWorkflowService.startCreditCardPaymentWorkflow).toHaveBeenCalledWith({
        paymentId: expect.any(String),
        cpf: '33258752036',
        description: 'Credit card payment',
        amount: 1000.00,
        preferenceUrl: 'https://mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
        payer: {
          email: undefined,
          name: undefined
        }
      });
      // Credit card payments should NOT call repository.save directly
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save error', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      paymentRepository.save.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow('Database connection failed');
      expect(eventPublisher.mergeObjectContext).not.toHaveBeenCalled();
    });

    it('should generate unique payment ID for each payment', async () => {
      // Arrange
      const cpfVO = new CPF(validCommand.cpf);
      const amountVO = new Money(validCommand.amount);

      const payment1 = Payment.create('id1', cpfVO, validCommand.description, amountVO, validCommand.paymentMethod);
      const payment2 = Payment.create('id2', cpfVO, validCommand.description, amountVO, validCommand.paymentMethod);

      paymentRepository.save
        .mockResolvedValueOnce(payment1)
        .mockResolvedValueOnce(payment2);

      // Act
      await handler.execute(validCommand);
      await handler.execute(validCommand);

      // Assert
      expect(paymentRepository.save).toHaveBeenCalledTimes(2);

      const firstCall = paymentRepository.save.mock.calls[0][0] as Payment;
      const secondCall = paymentRepository.save.mock.calls[1][0] as Payment;

      expect(firstCall.id).not.toBe(secondCall.id);
    });

    it('should preserve all input data in the created payment', async () => {
      // Arrange
      const testCommand = new CreatePaymentCommand(
        '33258752036',
        'Specific test payment description',
        250.75,
        PaymentMethod.CREDIT_CARD
      );

      const mockPreference = {
        id: 'pref-456',
        init_point: 'https://mercadopago.com/checkout/v1/redirect?pref_id=pref-456',
        sandbox_init_point: 'https://sandbox.mercadopago.com',
        collector_id: 123,
        client_id: '456',
        payment_status: 'pending' as const
      };

      mockMercadoPagoService.createPreference.mockResolvedValue(mockPreference);
      mockTemporalWorkflowService.startCreditCardPaymentWorkflow.mockResolvedValue({
        workflowId: 'workflow-456',
        runId: 'run-456'
      });

      // Act
      const result = await handler.execute(testCommand);

      // Assert
      expect(result.cpf).toBe('33258752036');
      expect(result.description).toBe('Specific test payment description');
      expect(result.amount).toBe(250.75);
      expect(result.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(result.status).toBe('PENDING');
      expect(typeof result.id).toBe('string');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.preferenceUrl).toBe('https://mercadopago.com/checkout/v1/redirect?pref_id=pref-456');
    });
  });
});
