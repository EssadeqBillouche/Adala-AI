import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { TenancyService } from './tenancy.service';

describe('TenancyService', () => {
  let service: TenancyService;
  let clsService: ClsService;
  let dataSource: DataSource;
  let mockManager: Partial<EntityManager>;

  const mockTenantId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    mockManager = {
      query: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const clsServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const dataSourceMock = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockManager as EntityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenancyService,
        {
          provide: ClsService,
          useValue: clsServiceMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<TenancyService>(TenancyService);
    clsService = module.get<ClsService>(ClsService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('runWithTenant', () => {
    it('should execute operation with tenant context', async () => {
      (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      const result = await service.runWithTenant(mockOperation);

      expect(clsService.get).toHaveBeenCalledWith('tenantId');
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockManager.query).toHaveBeenCalledWith(
        `SET LOCAL "app.current_tenant_id" = '${mockTenantId}'`,
      );
      expect(mockOperation).toHaveBeenCalledWith(mockManager);
      expect(result).toBe('result');
    });

    it('should throw UnauthorizedException when tenantId is missing', async () => {
      (clsService.get as jest.Mock).mockReturnValue(undefined);
      
      const mockOperation = jest.fn();

      await expect(service.runWithTenant(mockOperation)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.runWithTenant(mockOperation)).rejects.toThrow(
        'Tenant context is missing required for secured data access',
      );
    });

    it('should throw UnauthorizedException when tenantId is null', async () => {
      (clsService.get as jest.Mock).mockReturnValue(null);
      
      const mockOperation = jest.fn();

      await expect(service.runWithTenant(mockOperation)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should set tenant ID using SET LOCAL query', async () => {
      (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runWithTenant(mockOperation);

      expect(mockManager.query).toHaveBeenCalledWith(
        `SET LOCAL "app.current_tenant_id" = '${mockTenantId}'`,
      );
    });

    it('should execute operation within transaction', async () => {
      (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runWithTenant(mockOperation);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockOperation).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return the result from the operation', async () => {
      (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue({ data: 'test' });

      const result = await service.runWithTenant(mockOperation);

      expect(result).toEqual({ data: 'test' });
    });

    it('should work with different valid tenant IDs', async () => {
      const differentTenantId = '987f6543-e21b-32d3-a456-426614174000';
      (clsService.get as jest.Mock).mockReturnValue(differentTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runWithTenant(mockOperation);

      expect(mockManager.query).toHaveBeenCalledWith(
        `SET LOCAL "app.current_tenant_id" = '${differentTenantId}'`,
      );
    });

    it('should throw UnauthorizedException for invalid UUID tenant ID', async () => {
      const invalidTenantId = 'invalid-uuid';
      (clsService.get as jest.Mock).mockReturnValue(invalidTenantId);
      
      const mockOperation = jest.fn();

      await expect(service.runWithTenant(mockOperation)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.runWithTenant(mockOperation)).rejects.toThrow(
        'Invalid tenant identifier',
      );
    });

    it('should handle async operations', async () => {
      (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockImplementation(async () => {
        return Promise.resolve('async-result');
      });

      const result = await service.runWithTenant(mockOperation);

      expect(result).toBe('async-result');
    });
  });

  describe('runBypassingTenant', () => {
    it('should execute operation without tenant restriction', async () => {
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      const result = await service.runBypassingTenant(mockOperation);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockManager.query).toHaveBeenCalledWith(
        `RESET "app.current_tenant_id"`,
      );
      expect(mockOperation).toHaveBeenCalledWith(mockManager);
      expect(result).toBe('result');
    });

    it('should reset tenant ID to bypass RLS', async () => {
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runBypassingTenant(mockOperation);

      expect(mockManager.query).toHaveBeenCalledWith(
        `RESET "app.current_tenant_id"`,
      );
    });

    it('should execute operation within transaction', async () => {
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runBypassingTenant(mockOperation);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockOperation).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return the result from the operation', async () => {
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue({ data: 'bypass-result' });

      const result = await service.runBypassingTenant(mockOperation);

      expect(result).toEqual({ data: 'bypass-result' });
    });

    it('should not require tenant context', async () => {
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runBypassingTenant(mockOperation);

      expect(clsService.get).not.toHaveBeenCalled();
    });

    it('should handle async operations', async () => {
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockImplementation(async () => {
        return Promise.resolve('async-bypass-result');
      });

      const result = await service.runBypassingTenant(mockOperation);

      expect(result).toBe('async-bypass-result');
    });
  });

  describe('error handling', () => {
    describe('runWithTenant errors', () => {
      it('should handle database transaction errors', async () => {
        (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
        const dbError = new Error('Database connection error');
        (dataSource.transaction as jest.Mock).mockRejectedValue(dbError);
        
        const mockOperation = jest.fn();

        await expect(service.runWithTenant(mockOperation)).rejects.toThrow(
          'Database connection error',
        );
      });

      it('should handle query errors', async () => {
        (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
        const queryError = new Error('Query failed');
        (mockManager.query as jest.Mock).mockRejectedValue(queryError);
        
        const mockOperation = jest.fn();

        await expect(service.runWithTenant(mockOperation)).rejects.toThrow(
          'Query failed',
        );
      });

      it('should handle operation errors', async () => {
        (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
        (mockManager.query as jest.Mock).mockResolvedValue(undefined);
        const operationError = new Error('Operation failed');
        const mockOperation = jest.fn().mockRejectedValue(operationError);

        await expect(service.runWithTenant(mockOperation)).rejects.toThrow(
          'Operation failed',
        );
      });
    });

    describe('runBypassingTenant errors', () => {
      it('should handle database transaction errors', async () => {
        const dbError = new Error('Database connection error');
        (dataSource.transaction as jest.Mock).mockRejectedValue(dbError);
        
        const mockOperation = jest.fn();

        await expect(service.runBypassingTenant(mockOperation)).rejects.toThrow(
          'Database connection error',
        );
      });

      it('should handle query errors', async () => {
        const queryError = new Error('Query failed');
        (mockManager.query as jest.Mock).mockRejectedValue(queryError);
        
        const mockOperation = jest.fn();

        await expect(service.runBypassingTenant(mockOperation)).rejects.toThrow(
          'Query failed',
        );
      });

      it('should handle operation errors', async () => {
        (mockManager.query as jest.Mock).mockResolvedValue(undefined);
        const operationError = new Error('Operation failed');
        const mockOperation = jest.fn().mockRejectedValue(operationError);

        await expect(service.runBypassingTenant(mockOperation)).rejects.toThrow(
          'Operation failed',
        );
      });
    });
  });

  describe('transaction management', () => {
    it('should use transaction for runWithTenant', async () => {
      (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runWithTenant(mockOperation);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('should use transaction for runBypassingTenant', async () => {
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runBypassingTenant(mockOperation);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('should pass manager to operation callback', async () => {
      (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runWithTenant(mockOperation);

      expect(mockOperation).toHaveBeenCalledWith(mockManager);
    });
  });

  describe('RLS enforcement', () => {
    it('should enforce tenant isolation with SET LOCAL', async () => {
      (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runWithTenant(mockOperation);

      expect(mockManager.query).toHaveBeenCalledWith(
        `SET LOCAL "app.current_tenant_id" = '${mockTenantId}'`,
      );
    });

    it('should bypass tenant isolation with RESET', async () => {
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runBypassingTenant(mockOperation);

      expect(mockManager.query).toHaveBeenCalledWith(
        `RESET "app.current_tenant_id"`,
      );
    });
  });

  describe('CLS integration', () => {
    it('should get tenantId from CLS context', async () => {
      (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runWithTenant(mockOperation);

      expect(clsService.get).toHaveBeenCalledWith('tenantId');
      expect(clsService.get).toHaveBeenCalledTimes(1);
    });

    it('should validate tenantId before executing operation', async () => {
      (clsService.get as jest.Mock).mockReturnValue(undefined);
      
      const mockOperation = jest.fn();

      try {
        await service.runWithTenant(mockOperation);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }

      expect(mockOperation).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('method comparison', () => {
    it('should use correct SQL statement for each method', async () => {
      (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runWithTenant(mockOperation);
      await service.runBypassingTenant(mockOperation);

      expect(mockManager.query).toHaveBeenNthCalledWith(
        1,
        `SET LOCAL "app.current_tenant_id" = '${mockTenantId}'`,
      );
      expect(mockManager.query).toHaveBeenNthCalledWith(
        2,
        `RESET "app.current_tenant_id"`,
      );
    });

    it('should require tenantId for runWithTenant but not for runBypassingTenant', async () => {
      (clsService.get as jest.Mock).mockReturnValue(mockTenantId);
      (mockManager.query as jest.Mock).mockResolvedValue(undefined);
      
      const mockOperation = jest.fn().mockResolvedValue('result');

      await service.runWithTenant(mockOperation);
      await service.runBypassingTenant(mockOperation);

      expect(clsService.get).toHaveBeenCalledTimes(1);
    });
  });
});
