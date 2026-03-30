import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ApiKeyService } from './api-key.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
  })),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'hashed-key-value'),
  })),
}));

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let tenancyService: TenancyService;
  let dataSource: DataSource;
  let mockManager: Partial<EntityManager>;

  const mockOrganizationId = 'org-123e4567-e89b-12d3-a456-426614174000';
  const mockApiKeyId = 'key-123e4567-e89b-12d3-a456-426614174000';

  const mockApiKey: Partial<ApiKey> = {
    id: mockApiKeyId,
    name: 'Production Key',
    keyPrefix: 'sk_abcdef1234',
    keyHash: 'hashed-key-value',
    scopes: ['read', 'write'],
    rateLimit: 100,
    expiresAt: null,
    lastUsedAt: null,
    isRevoked: false,
    organizationId: mockOrganizationId,
    revoke: jest.fn(),
    isValid: jest.fn(),
  };

  beforeEach(async () => {
    mockManager = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const tenancyServiceMock = {
      runWithTenant: jest.fn((callback) => callback(mockManager as EntityManager)),
      runBypassingTenant: jest.fn((callback) => callback(mockManager as EntityManager)),
    };

    const dataSourceMock = {
      transaction: jest.fn((callback) => callback(mockManager as EntityManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        {
          provide: TenancyService,
          useValue: tenancyServiceMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<ApiKeyService>(ApiKeyService);
    tenancyService = module.get<TenancyService>(TenancyService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateApiKey', () => {
    it('should generate an API key with correct format', () => {
      const result = service.generateApiKey();

      expect(result.key).toBe('sk_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      expect(result.keyPrefix).toBe('sk_abcdef123');
      expect(result.keyHash).toBe('hashed-key-value');
    });

    it('should generate unique keys on each call', () => {
      const result1 = service.generateApiKey();
      const result2 = service.generateApiKey();

      expect(result1.key).toBe(result2.key);
    });
  });

  describe('create', () => {
    const createDto: CreateApiKeyDto = {
      name: 'Test API Key',
      scopes: ['read'],
      rateLimit: 50,
    };

    it('should create an API key successfully', async () => {
      const createdApiKey = { ...mockApiKey, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdApiKey);
      (mockManager.save as jest.Mock).mockResolvedValue(createdApiKey);

      const result = await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.create).toHaveBeenCalledWith(ApiKey, {
        ...createDto,
        keyPrefix: 'sk_abcdef12',
        keyHash: 'hashed-key-value',
        organizationId: mockOrganizationId,
      });
      expect(result.apiKey).toEqual(createdApiKey);
      expect(result.key).toBe('sk_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    });

    it('should include organizationId in the created API key', async () => {
      const createdApiKey = { ...mockApiKey, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdApiKey);
      (mockManager.save as jest.Mock).mockResolvedValue(createdApiKey);

      await service.create(createDto, mockOrganizationId);

      expect(mockManager.create).toHaveBeenCalledWith(ApiKey, {
        ...createDto,
        keyPrefix: 'sk_abcdef123',
        keyHash: 'hashed-key-value',
        organizationId: mockOrganizationId,
      });
    });

    it('should create an API key with default values', async () => {
      const minimalDto: CreateApiKeyDto = {
        name: 'Minimal Key',
      };
      const createdApiKey = {
        ...mockApiKey,
        ...minimalDto,
        scopes: [],
        rateLimit: 100,
      };
      (mockManager.create as jest.Mock).mockReturnValue(createdApiKey);
      (mockManager.save as jest.Mock).mockResolvedValue(createdApiKey);

      const result = await service.create(minimalDto, mockOrganizationId);

      expect(result.apiKey.name).toBe('Minimal Key');
    });

    it('should create an API key with expiration date', async () => {
      const createDtoWithExpiry: CreateApiKeyDto = {
        name: 'Expiring Key',
        expiresAt: '2025-12-31T23:59:59Z',
      };
      const createdApiKey = { ...mockApiKey, ...createDtoWithExpiry };
      (mockManager.create as jest.Mock).mockReturnValue(createdApiKey);
      (mockManager.save as jest.Mock).mockResolvedValue(createdApiKey);

      const result = await service.create(createDtoWithExpiry, mockOrganizationId);

      expect(result.apiKey.expiresAt).toBeDefined();
    });
  });

  describe('findAll', () => {
    const mockApiKeys = [
      {
        ...mockApiKey,
        id: 'key-1',
        name: 'Key 1',
        keyHash: undefined,
      },
      {
        ...mockApiKey,
        id: 'key-2',
        name: 'Key 2',
        keyHash: undefined,
      },
    ];

    it('should return all API keys for the organization', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockApiKeys);

      const result = await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.find).toHaveBeenCalledWith(ApiKey, {
        select: [
          'id',
          'name',
          'keyPrefix',
          'scopes',
          'rateLimit',
          'expiresAt',
          'lastUsedAt',
          'isRevoked',
          'createdAt',
        ],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockApiKeys);
    });

    it('should exclude keyHash from results', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockApiKeys);

      await service.findAll();

      expect(mockManager.find).toHaveBeenCalledWith(ApiKey, {
        select: expect.not.arrayContaining(['keyHash']),
      });
    });

    it('should order by createdAt DESC', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockApiKeys);

      await service.findAll();

      expect(mockManager.find).toHaveBeenCalledWith(ApiKey, {
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no API keys exist', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an API key by id', async () => {
      const keyWithoutHash = { ...mockApiKey, keyHash: undefined };
      (mockManager.findOne as jest.Mock).mockResolvedValue(keyWithoutHash);

      const result = await service.findOne(mockApiKeyId);

      expect(mockManager.findOne).toHaveBeenCalledWith(ApiKey, {
        where: { id: mockApiKeyId },
        select: [
          'id',
          'name',
          'keyPrefix',
          'scopes',
          'rateLimit',
          'expiresAt',
          'lastUsedAt',
          'isRevoked',
          'createdAt',
        ],
      });
      expect(result).toEqual(keyWithoutHash);
    });

    it('should throw NotFoundException when API key not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockApiKeyId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockApiKeyId)).rejects.toThrow(
        `ApiKey with ID ${mockApiKeyId} not found`,
      );
    });

    it('should exclude keyHash from result', async () => {
      const keyWithoutHash = { ...mockApiKey, keyHash: undefined };
      (mockManager.findOne as jest.Mock).mockResolvedValue(keyWithoutHash);

      const result = await service.findOne(mockApiKeyId);

      expect(result.keyHash).toBeUndefined();
    });
  });

  describe('update', () => {
    const updateDto: UpdateApiKeyDto = {
      name: 'Updated Key Name',
      scopes: ['read', 'write', 'delete'],
    };

    it('should update an API key successfully', async () => {
      const updatedApiKey = { ...mockApiKey, ...updateDto, keyHash: undefined };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockApiKey);
      (mockManager.save as jest.Mock).mockResolvedValue(updatedApiKey);

      const result = await service.update(mockApiKeyId, updateDto);

      expect(mockManager.findOne).toHaveBeenCalledWith(ApiKey, {
        where: { id: mockApiKeyId },
      });
      expect(mockManager.save).toHaveBeenCalledWith(ApiKey, mockApiKey);
      expect(result).toEqual(updatedApiKey);
    });

    it('should throw NotFoundException when updating non-existent API key', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update(mockApiKeyId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(mockApiKeyId, updateDto)).rejects.toThrow(
        `ApiKey with ID ${mockApiKeyId} not found`,
      );
    });

    it('should assign update dto properties to API key', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockApiKey);
      (mockManager.save as jest.Mock).mockResolvedValue(mockApiKey);

      await service.update(mockApiKeyId, updateDto);

      expect(mockApiKey.name).toBe(updateDto.name);
      expect(mockApiKey.scopes).toEqual(updateDto.scopes);
    });

    it('should update only provided fields', async () => {
      const mockKey = { ...mockApiKey, name: 'Original Name', scopes: ['read'] };
      const partialUpdate: UpdateApiKeyDto = {
        rateLimit: 200,
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockKey);
      (mockManager.save as jest.Mock).mockResolvedValue(mockKey);

      await service.update(mockApiKeyId, partialUpdate);

      expect(mockKey.rateLimit).toBe(200);
      expect(mockKey.name).toBe('Original Name');
    });
  });

  describe('revoke', () => {
    it('should revoke an API key successfully', async () => {
      const revokedKey = { ...mockApiKey, isRevoked: true, keyHash: undefined };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockApiKey);
      (mockManager.save as jest.Mock).mockResolvedValue(revokedKey);

      const result = await service.revoke(mockApiKeyId);

      expect(mockManager.findOne).toHaveBeenCalledWith(ApiKey, {
        where: { id: mockApiKeyId },
      });
      expect(mockApiKey.revoke).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalledWith(ApiKey, mockApiKey);
      expect(result).toEqual(revokedKey);
    });

    it('should throw NotFoundException when revoking non-existent API key', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.revoke(mockApiKeyId)).rejects.toThrow(NotFoundException);
      await expect(service.revoke(mockApiKeyId)).rejects.toThrow(
        `ApiKey with ID ${mockApiKeyId} not found`,
      );
    });

    it('should set isRevoked to true', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockApiKey);
      (mockManager.save as jest.Mock).mockResolvedValue(mockApiKey);

      await service.revoke(mockApiKeyId);

      expect(mockApiKey.isRevoked).toBe(true);
    });
  });

  describe('remove', () => {
    it('should remove an API key successfully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockApiKey);
      (mockManager.remove as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await service.remove(mockApiKeyId);

      expect(mockManager.findOne).toHaveBeenCalledWith(ApiKey, {
        where: { id: mockApiKeyId },
      });
      expect(mockManager.remove).toHaveBeenCalledWith(ApiKey, mockApiKey);
      expect(result).toEqual({ id: mockApiKeyId, deleted: true });
    });

    it('should throw NotFoundException when removing non-existent API key', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(mockApiKeyId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(mockApiKeyId)).rejects.toThrow(
        `ApiKey with ID ${mockApiKeyId} not found`,
      );
    });
  });

  describe('validateKey', () => {
    const testApiKey = 'sk_test1234567890';

    it('should validate a valid API key', async () => {
      const validKey = { ...mockApiKey, isValid: jest.fn().mockReturnValue(true) };
      (mockManager.findOne as jest.Mock).mockResolvedValue(validKey);
      (mockManager.save as jest.Mock).mockResolvedValue(validKey);

      const result = await service.validateKey(testApiKey);

      expect(tenancyService.runBypassingTenant).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(ApiKey, {
        where: { keyHash: 'hashed-key-value' },
        relations: ['organization'],
      });
      expect(result).toEqual(validKey);
    });

    it('should return null for invalid API key', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.validateKey(testApiKey);

      expect(result).toBeNull();
    });

    it('should return null for revoked API key', async () => {
      const revokedKey = { ...mockApiKey, isRevoked: true, isValid: jest.fn().mockReturnValue(false) };
      (mockManager.findOne as jest.Mock).mockResolvedValue(revokedKey);

      const result = await service.validateKey(testApiKey);

      expect(result).toBeNull();
    });

    it('should return null for expired API key', async () => {
      const expiredKey = {
        ...mockApiKey,
        expiresAt: new Date('2020-01-01'),
        isValid: jest.fn().mockReturnValue(false),
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(expiredKey);

      const result = await service.validateKey(testApiKey);

      expect(result).toBeNull();
    });

    it('should update lastUsedAt on successful validation', async () => {
      const validKey = { ...mockApiKey, isValid: jest.fn().mockReturnValue(true) };
      (mockManager.findOne as jest.Mock).mockResolvedValue(validKey);
      (mockManager.save as jest.Mock).mockResolvedValue(validKey);

      await service.validateKey(testApiKey);

      expect(validKey.lastUsedAt).toBeInstanceOf(Date);
      expect(mockManager.save).toHaveBeenCalledWith(ApiKey, validKey);
    });
  });

  describe('multi-tenancy', () => {
    it('should use runWithTenant for create operations', async () => {
      const createDto: CreateApiKeyDto = { name: 'Test' };
      (mockManager.create as jest.Mock).mockReturnValue(mockApiKey);
      (mockManager.save as jest.Mock).mockResolvedValue(mockApiKey);

      await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });

    it('should use runWithTenant for find operations', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });

    it('should use runBypassingTenant for validateKey', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await service.validateKey('sk_test');

      expect(tenancyService.runBypassingTenant).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection error');
      (mockManager.findOne as jest.Mock).mockRejectedValue(dbError);

      await expect(service.findOne(mockApiKeyId)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle transaction errors', async () => {
      const transactionError = new Error('Transaction failed');
      (mockManager.save as jest.Mock).mockRejectedValue(transactionError);
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockApiKey);

      const updateDto: UpdateApiKeyDto = { name: 'Test' };

      await expect(service.update(mockApiKeyId, updateDto)).rejects.toThrow(
        'Transaction failed',
      );
    });
  });

  describe('isValid', () => {
    it('should return false for revoked key', () => {
      const revokedKey = { ...mockApiKey, isRevoked: true };
      revokedKey.isValid = jest.fn().mockReturnValue(false);

      expect(revokedKey.isValid()).toBe(false);
    });

    it('should return false for expired key', () => {
      const expiredKey = {
        ...mockApiKey,
        expiresAt: new Date('2020-01-01'),
        isRevoked: false,
      };
      expiredKey.isValid = jest.fn().mockReturnValue(false);

      expect(expiredKey.isValid()).toBe(false);
    });

    it('should return true for valid key', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const validKey = {
        ...mockApiKey,
        expiresAt: futureDate,
        isRevoked: false,
      };
      validKey.isValid = jest.fn().mockReturnValue(true);

      expect(validKey.isValid()).toBe(true);
    });

    it('should return true for key without expiration', () => {
      const noExpiryKey = {
        ...mockApiKey,
        expiresAt: null,
        isRevoked: false,
      };
      noExpiryKey.isValid = jest.fn().mockReturnValue(true);

      expect(noExpiryKey.isValid()).toBe(true);
    });
  });
});
