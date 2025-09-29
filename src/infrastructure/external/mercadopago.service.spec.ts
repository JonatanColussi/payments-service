import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoService } from './mercadopago.service';
import { MercadoPagoPaymentItem } from '../../domain/entities/mercadopago-payment.entity';

// Mock the MercadoPago SDK
jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Preference: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
  })),
  Payment: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    search: jest.fn(),
  })),
}));

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;
  let configService: jest.Mocked<ConfigService>;
  let mockPreference: any;
  let mockPayment: any;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Preference, Payment } = require('mercadopago');

    mockPreference = {
      create: jest.fn(),
    };
    mockPayment = {
      get: jest.fn(),
      search: jest.fn(),
    };

    Preference.mockImplementation(() => mockPreference);
    Payment.mockImplementation(() => mockPayment);

    // Setup default config values
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        'mercadopago.accessToken': 'test-access-token',
        'MERCADOPAGO_ACCESS_TOKEN': 'test-access-token',
        'mercadopago.timeout': 5000,
        'mercadopago.webhookUrl': 'https://api.test.com/webhooks/mercadopago',
        'mercadopago.backUrls.success': 'https://test.com/success',
        'mercadopago.backUrls.failure': 'https://test.com/failure',
        'mercadopago.backUrls.pending': 'https://test.com/pending',
      };
      return config[key] || defaultValue;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MercadoPagoService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MercadoPagoService>(MercadoPagoService);
    configService = module.get(ConfigService);
  });

  describe('constructor', () => {
    it('should throw error when access token is not provided', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => {
        new MercadoPagoService(configService);
      }).toThrow('MERCADOPAGO_ACCESS_TOKEN is required');
    });

    it('should initialize with access token from config', () => {
      expect(() => service).not.toThrow();
      expect(configService.get).toHaveBeenCalledWith('mercadopago.accessToken');
    });
  });

  describe('createPreference', () => {
    const mockItems: MercadoPagoPaymentItem[] = [
      {
        title: 'Test Payment',
        description: 'Test payment description',
        quantity: 1,
        unit_price: 100.00,
        currency_id: 'BRL'
      }
    ];

    it('should create preference successfully', async () => {
      // Arrange
      const mockResponse = {
        id: 'pref-123456789',
        init_point: 'https://mercadopago.com/init-point',
        sandbox_init_point: 'https://sandbox.mercadopago.com/init-point',
        collector_id: 123456,
        client_id: '654321',
      };

      mockPreference.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.createPreference('payment-123', mockItems);

      // Assert
      expect(mockPreference.create).toHaveBeenCalledWith({
        body: {
          items: [{
            id: 'item-0',
            title: 'Test Payment',
            description: 'Test payment description',
            quantity: 1,
            unit_price: 100.00,
            currency_id: 'BRL'
          }],
          external_reference: 'payment-123',
          notification_url: 'https://api.test.com/webhooks/mercadopago',
          back_urls: {
            success: 'https://test.com/success',
            failure: 'https://test.com/failure',
            pending: 'https://test.com/pending'
          },
          auto_return: 'approved',
          payment_methods: {
            excluded_payment_methods: [],
            excluded_payment_types: [],
            installments: 12
          },
          payer: undefined
        }
      });

      expect(result).toEqual({
        id: 'pref-123456789',
        init_point: 'https://mercadopago.com/init-point',
        sandbox_init_point: 'https://sandbox.mercadopago.com/init-point',
        collector_id: 123456,
        client_id: '654321',
        payment_status: 'pending'
      });
    });

    it('should create preference with payer information', async () => {
      // Arrange
      const mockResponse = {
        id: 'pref-123456789',
        init_point: 'https://mercadopago.com/init-point',
        sandbox_init_point: 'https://sandbox.mercadopago.com/init-point',
        collector_id: 123456,
        client_id: '654321',
      };

      mockPreference.create.mockResolvedValue(mockResponse);
      const payer = { email: 'test@test.com', name: 'Test User' };

      // Act
      await service.createPreference('payment-123', mockItems, payer);

      // Assert
      expect(mockPreference.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            payer: {
              email: 'test@test.com',
              name: 'Test User'
            }
          })
        })
      );
    });

    it('should handle MercadoPago API errors', async () => {
      // Arrange
      const apiError = new Error('MercadoPago API error');
      mockPreference.create.mockRejectedValue(apiError);

      // Act & Assert
      await expect(
        service.createPreference('payment-123', mockItems)
      ).rejects.toThrow('Failed to create MercadoPago preference: MercadoPago API error');
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status successfully', async () => {
      // Arrange
      const mockResponse = {
        id: 123456789,
        status: 'approved',
        status_detail: 'accredited',
        external_reference: 'payment-123',
        transaction_amount: 100.00,
        date_created: '2023-01-01T12:00:00Z',
        date_approved: '2023-01-01T12:01:00Z'
      };

      mockPayment.get.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getPaymentStatus('123456789');

      // Assert
      expect(mockPayment.get).toHaveBeenCalledWith({ id: '123456789' });
      expect(result).toEqual({
        id: '123456789',
        status: 'approved',
        status_detail: 'accredited',
        external_reference: 'payment-123',
        transaction_amount: 100.00,
        date_created: '2023-01-01T12:00:00Z',
        date_approved: '2023-01-01T12:01:00Z'
      });
    });

    it('should return null when payment not found', async () => {
      // Arrange
      mockPayment.get.mockResolvedValue(null);

      // Act
      const result = await service.getPaymentStatus('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle MercadoPago API errors', async () => {
      // Arrange
      const apiError = new Error('Payment not found');
      mockPayment.get.mockRejectedValue(apiError);

      // Act & Assert
      await expect(
        service.getPaymentStatus('123456789')
      ).rejects.toThrow('Failed to get payment status: Payment not found');
    });
  });

  describe('searchPaymentsByExternalReference', () => {
    it('should search payments successfully', async () => {
      // Arrange
      const mockResponse = {
        results: [
          {
            id: 123456789,
            status: 'approved',
            status_detail: 'accredited',
            external_reference: 'payment-123',
            transaction_amount: 100.00,
            date_created: '2023-01-01T12:00:00Z',
            date_approved: '2023-01-01T12:01:00Z'
          }
        ]
      };

      mockPayment.search.mockResolvedValue(mockResponse);

      // Act
      const result = await service.searchPaymentsByExternalReference('payment-123');

      // Assert
      expect(mockPayment.search).toHaveBeenCalledWith({
        options: {
          external_reference: 'payment-123'
        }
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '123456789',
        status: 'approved',
        status_detail: 'accredited',
        external_reference: 'payment-123',
        transaction_amount: 100.00,
        date_created: '2023-01-01T12:00:00Z',
        date_approved: '2023-01-01T12:01:00Z'
      });
    });

    it('should return empty array when no payments found', async () => {
      // Arrange
      mockPayment.search.mockResolvedValue({ results: [] });

      // Act
      const result = await service.searchPaymentsByExternalReference('non-existent');

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle search API errors', async () => {
      // Arrange
      const apiError = new Error('Search failed');
      mockPayment.search.mockRejectedValue(apiError);

      // Act & Assert
      await expect(
        service.searchPaymentsByExternalReference('payment-123')
      ).rejects.toThrow('Failed to search payments: Search failed');
    });
  });

  describe('mapMercadoPagoStatusToPaymentStatus', () => {
    it('should map approved status to PAID', () => {
      expect(service.mapMercadoPagoStatusToPaymentStatus('approved')).toBe('PAID');
    });

    it('should map rejected status to FAIL', () => {
      expect(service.mapMercadoPagoStatusToPaymentStatus('rejected')).toBe('FAIL');
    });

    it('should map cancelled status to FAIL', () => {
      expect(service.mapMercadoPagoStatusToPaymentStatus('cancelled')).toBe('FAIL');
    });

    it('should map pending status to PENDING', () => {
      expect(service.mapMercadoPagoStatusToPaymentStatus('pending')).toBe('PENDING');
    });

    it('should map in_process status to PENDING', () => {
      expect(service.mapMercadoPagoStatusToPaymentStatus('in_process')).toBe('PENDING');
    });

    it('should map unknown status to PENDING', () => {
      expect(service.mapMercadoPagoStatusToPaymentStatus('unknown')).toBe('PENDING');
    });
  });
});
