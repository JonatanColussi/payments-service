import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PaymentCreatedEventHandler } from './payment-created.event-handler';
import { PaymentCreatedEvent } from '../../domain/events';
import { PaymentMethod } from '../../domain/entities';

describe('PaymentCreatedEventHandler', () => {
  let handler: PaymentCreatedEventHandler;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentCreatedEventHandler],
    }).compile();

    handler = module.get<PaymentCreatedEventHandler>(PaymentCreatedEventHandler);

    // Mock the logger
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    // Replace the private logger with our mock
    (handler as any).logger = logger;
  });

  describe('handle', () => {
    it('should log payment creation event with PIX method', () => {
      // Arrange
      const event = new PaymentCreatedEvent(
        'payment-123',
        '33258752036',
        100.50,
        PaymentMethod.PIX,
        'Test payment description',
        new Date('2023-01-01T10:00:00Z')
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledWith(
        'Payment created: payment-123 for CPF: 33258752036, Amount: 100.5, Method: PIX'
      );
    });

    it('should log payment creation event with Credit Card method', () => {
      // Arrange
      const event = new PaymentCreatedEvent(
        'payment-456',
        '33258752036',
        250.75,
        PaymentMethod.CREDIT_CARD,
        'Credit card payment',
        new Date('2023-01-01T15:30:00Z')
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Payment created: payment-456 for CPF: 33258752036, Amount: 250.75, Method: CREDIT_CARD'
      );
    });

    it('should handle events with different CPF formats', () => {
      // Arrange
      const event = new PaymentCreatedEvent(
        'payment-789',
        '33322211109',
        1000.00,
        PaymentMethod.PIX,
        'Another test payment',
        new Date()
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Payment created: payment-789 for CPF: 33322211109, Amount: 1000, Method: PIX'
      );
    });

    it('should handle events with decimal amounts', () => {
      // Arrange
      const event = new PaymentCreatedEvent(
        'payment-decimal',
        '33258752036',
        99.99,
        PaymentMethod.PIX,
        'Decimal amount payment',
        new Date()
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Payment created: payment-decimal for CPF: 33258752036, Amount: 99.99, Method: PIX'
      );
    });

    it('should handle events with minimum amounts', () => {
      // Arrange
      const event = new PaymentCreatedEvent(
        'payment-min',
        '33258752036',
        0.01,
        PaymentMethod.PIX,
        'Minimum amount payment',
        new Date()
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Payment created: payment-min for CPF: 33258752036, Amount: 0.01, Method: PIX'
      );
    });

    it('should handle events with large amounts', () => {
      // Arrange
      const event = new PaymentCreatedEvent(
        'payment-large',
        '33258752036',
        50000.00,
        PaymentMethod.CREDIT_CARD,
        'Large amount payment',
        new Date()
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Payment created: payment-large for CPF: 33258752036, Amount: 50000, Method: CREDIT_CARD'
      );
    });

    it('should handle multiple events sequentially', () => {
      // Arrange
      const event1 = new PaymentCreatedEvent(
        'payment-1',
        '33258752036',
        100.00,
        PaymentMethod.PIX,
        'First payment',
        new Date()
      );

      const event2 = new PaymentCreatedEvent(
        'payment-2',
        '33258752036',
        200.00,
        PaymentMethod.CREDIT_CARD,
        'Second payment',
        new Date()
      );

      // Act
      handler.handle(event1);
      handler.handle(event2);

      // Assert
      expect(logger.log).toHaveBeenCalledTimes(2);
      expect(logger.log).toHaveBeenNthCalledWith(1,
        'Payment created: payment-1 for CPF: 33258752036, Amount: 100, Method: PIX'
      );
      expect(logger.log).toHaveBeenNthCalledWith(2,
        'Payment created: payment-2 for CPF: 33258752036, Amount: 200, Method: CREDIT_CARD'
      );
    });

    it('should not throw errors when handling valid events', () => {
      // Arrange
      const event = new PaymentCreatedEvent(
        'payment-safe',
        '33258752036',
        100.00,
        PaymentMethod.PIX,
        'Safe payment test',
        new Date()
      );

      // Act & Assert
      expect(() => handler.handle(event)).not.toThrow();
    });

    it('should handle events with special characters in description', () => {
      // Arrange
      const event = new PaymentCreatedEvent(
        'payment-special',
        '33258752036',
        100.00,
        PaymentMethod.PIX,
        'Payment with special chars: áéíóú ção',
        new Date()
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Payment created: payment-special for CPF: 33258752036, Amount: 100, Method: PIX'
      );
    });

    it('should handle events with different timestamps', () => {
      // Arrange
      const pastDate = new Date('2020-01-01T00:00:00Z');
      const futureDate = new Date('2030-12-31T23:59:59Z');

      const event1 = new PaymentCreatedEvent(
        'payment-past',
        '33258752036',
        100.00,
        PaymentMethod.PIX,
        'Past payment',
        pastDate
      );

      const event2 = new PaymentCreatedEvent(
        'payment-future',
        '33258752036',
        100.00,
        PaymentMethod.PIX,
        'Future payment',
        futureDate
      );

      // Act
      handler.handle(event1);
      handler.handle(event2);

      // Assert
      expect(logger.log).toHaveBeenCalledTimes(2);
      // Both should log successfully regardless of timestamp
    });
  });
});
