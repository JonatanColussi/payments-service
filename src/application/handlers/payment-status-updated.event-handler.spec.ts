import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PaymentStatusUpdatedEventHandler } from './payment-status-updated.event-handler';
import { PaymentStatusUpdatedEvent } from '../../domain/events';
import { PaymentStatus } from '../../domain/entities';

describe('PaymentStatusUpdatedEventHandler', () => {
  let handler: PaymentStatusUpdatedEventHandler;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentStatusUpdatedEventHandler],
    }).compile();

    handler = module.get<PaymentStatusUpdatedEventHandler>(PaymentStatusUpdatedEventHandler);

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
    it('should log payment status update from PENDING to PAID', () => {
      // Arrange
      const event = new PaymentStatusUpdatedEvent(
        'payment-123',
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        new Date('2023-01-01T10:00:00Z')
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledTimes(1);
      expect(logger.log).toHaveBeenCalledWith(
        'Payment status updated: payment-123 from PENDING to PAID'
      );
    });

    it('should log payment status update from PENDING to FAIL', () => {
      // Arrange
      const event = new PaymentStatusUpdatedEvent(
        'payment-456',
        PaymentStatus.PENDING,
        PaymentStatus.FAIL,
        new Date('2023-01-01T15:30:00Z')
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Payment status updated: payment-456 from PENDING to FAIL'
      );
    });

    it('should handle different payment IDs', () => {
      // Arrange
      const event = new PaymentStatusUpdatedEvent(
        'payment-uuid-789-abc-def',
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        new Date()
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Payment status updated: payment-uuid-789-abc-def from PENDING to PAID'
      );
    });

    it('should handle multiple status update events', () => {
      // Arrange
      const event1 = new PaymentStatusUpdatedEvent(
        'payment-1',
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        new Date()
      );

      const event2 = new PaymentStatusUpdatedEvent(
        'payment-2',
        PaymentStatus.PENDING,
        PaymentStatus.FAIL,
        new Date()
      );

      // Act
      handler.handle(event1);
      handler.handle(event2);

      // Assert
      expect(logger.log).toHaveBeenCalledTimes(2);
      expect(logger.log).toHaveBeenNthCalledWith(1,
        'Payment status updated: payment-1 from PENDING to PAID'
      );
      expect(logger.log).toHaveBeenNthCalledWith(2,
        'Payment status updated: payment-2 from PENDING to FAIL'
      );
    });

    it('should handle events with different timestamps', () => {
      // Arrange
      const pastDate = new Date('2020-01-01T00:00:00Z');
      const futureDate = new Date('2030-12-31T23:59:59Z');

      const event1 = new PaymentStatusUpdatedEvent(
        'payment-past',
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        pastDate
      );

      const event2 = new PaymentStatusUpdatedEvent(
        'payment-future',
        PaymentStatus.PENDING,
        PaymentStatus.FAIL,
        futureDate
      );

      // Act
      handler.handle(event1);
      handler.handle(event2);

      // Assert
      expect(logger.log).toHaveBeenCalledTimes(2);
      // Both should log successfully regardless of timestamp
    });

    it('should not throw errors when handling valid events', () => {
      // Arrange
      const event = new PaymentStatusUpdatedEvent(
        'payment-safe',
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        new Date()
      );

      // Act & Assert
      expect(() => handler.handle(event)).not.toThrow();
    });

    it('should handle rapid sequential events for same payment', () => {
      // Arrange
      const baseTimestamp = new Date('2023-01-01T10:00:00Z');

      // Note: In practice, these transitions wouldn't be valid due to domain rules,
      // but testing the event handler in isolation
      const event1 = new PaymentStatusUpdatedEvent(
        'payment-same',
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        baseTimestamp
      );

      const event2 = new PaymentStatusUpdatedEvent(
        'payment-same',
        PaymentStatus.PENDING,
        PaymentStatus.FAIL,
        new Date(baseTimestamp.getTime() + 1000)
      );

      // Act
      handler.handle(event1);
      handler.handle(event2);

      // Assert
      expect(logger.log).toHaveBeenCalledTimes(2);
      expect(logger.log).toHaveBeenNthCalledWith(1,
        'Payment status updated: payment-same from PENDING to PAID'
      );
      expect(logger.log).toHaveBeenNthCalledWith(2,
        'Payment status updated: payment-same from PENDING to FAIL'
      );
    });

    it('should handle events with very long payment IDs', () => {
      // Arrange
      const longPaymentId = 'payment-' + 'a'.repeat(100);
      const event = new PaymentStatusUpdatedEvent(
        longPaymentId,
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        new Date()
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        `Payment status updated: ${longPaymentId} from PENDING to PAID`
      );
    });

    it('should handle events with special characters in payment ID', () => {
      // Arrange
      const specialPaymentId = 'payment-123-áéí-@#$';
      const event = new PaymentStatusUpdatedEvent(
        specialPaymentId,
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        new Date()
      );

      // Act
      handler.handle(event);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        `Payment status updated: ${specialPaymentId} from PENDING to PAID`
      );
    });

    it('should maintain consistent logging format across all status combinations', () => {
      // Arrange
      const statusCombinations = [
        { from: PaymentStatus.PENDING, to: PaymentStatus.PAID },
        { from: PaymentStatus.PENDING, to: PaymentStatus.FAIL },
      ];

      // Act & Assert
      statusCombinations.forEach(({ from, to }, index) => {
        const event = new PaymentStatusUpdatedEvent(
          `payment-${index}`,
          from,
          to,
          new Date()
        );

        handler.handle(event);

        expect(logger.log).toHaveBeenCalledWith(
          `Payment status updated: payment-${index} from ${from} to ${to}`
        );
      });

      expect(logger.log).toHaveBeenCalledTimes(statusCombinations.length);
    });
  });
});
