import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { AuditLogService } from './audit-log.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { AuditLog } from './entities/audit-log.entity';
import { ActorType } from './entities/enums/actor-type.enum';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let tenancyService: TenancyService;
  let dataSource: DataSource;
  let mockManager: Partial<EntityManager>;

  const mockOrganizationId = 'org-123e4567-e89b-12d3-a456-426614174000';
  const mockResourceId = 'resource-123e4567-e89b-12d3-a456-426614174000';

  const mockAuditLog: Partial<AuditLog> = {
    id: 'audit-123e4567-e89b-12d3-a456-426614174000',
    actorType: ActorType.USER,
    action: 'CREATE',
    resourceType: 'Project',
    resourceId: mockResourceId,
    diff: { title: { old: 'Old', new: 'New' } },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    organizationId: mockOrganizationId,
  };

  beforeEach(async () => {
    mockManager = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const tenancyServiceMock = {
      runWithTenant: jest.fn((callback) => callback(mockManager as EntityManager)),
    };

    const dataSourceMock = {
      transaction: jest.fn((callback) => callback(mockManager as EntityManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
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

    service = module.get<AuditLogService>(AuditLogService);
    tenancyService = module.get<TenancyService>(TenancyService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log entry successfully', async () => {
      const createdLog = { ...mockAuditLog };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(
        ActorType.USER,
        'CREATE',
        'Project',
        mockResourceId,
      );

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.create).toHaveBeenCalledWith(AuditLog, {
        actorType: ActorType.USER,
        action: 'CREATE',
        resourceType: 'Project',
        resourceId: mockResourceId,
        diff: undefined,
        ipAddress: undefined,
        userAgent: undefined,
      });
      expect(mockManager.save).toHaveBeenCalledWith(AuditLog, createdLog);
      expect(result).toEqual(createdLog);
    });

    it('should create an audit log with all optional fields', async () => {
      const diff = { status: { old: 'draft', new: 'published' } };
      const ipAddress = '10.0.0.1';
      const userAgent = 'PostmanRuntime/7.32.3';
      const createdLog = {
        ...mockAuditLog,
        diff,
        ipAddress,
        userAgent,
      };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(
        ActorType.USER,
        'UPDATE',
        'Project',
        mockResourceId,
        diff,
        ipAddress,
        userAgent,
      );

      expect(mockManager.create).toHaveBeenCalledWith(AuditLog, {
        actorType: ActorType.USER,
        action: 'UPDATE',
        resourceType: 'Project',
        resourceId: mockResourceId,
        diff,
        ipAddress,
        userAgent,
      });
      expect(result.diff).toEqual(diff);
      expect(result.ipAddress).toBe(ipAddress);
      expect(result.userAgent).toBe(userAgent);
    });

    it('should create an audit log for SYSTEM actor', async () => {
      const createdLog = { ...mockAuditLog, actorType: ActorType.SYSTEM, action: 'AUTO_ARCHIVE' };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(
        ActorType.SYSTEM,
        'AUTO_ARCHIVE',
        'Conversation',
        mockResourceId,
      );

      expect(result.actorType).toBe(ActorType.SYSTEM);
      expect(result.action).toBe('AUTO_ARCHIVE');
    });

    it('should create an audit log for API_KEY actor', async () => {
      const createdLog = { ...mockAuditLog, actorType: ActorType.API_KEY, action: 'DELETE' };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(
        ActorType.API_KEY,
        'DELETE',
        'LegalSource',
        mockResourceId,
      );

      expect(result.actorType).toBe(ActorType.API_KEY);
      expect(result.action).toBe('DELETE');
    });

    it('should create an audit log without diff', async () => {
      const createdLog = { ...mockAuditLog };
      delete createdLog.diff;
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(
        ActorType.USER,
        'VIEW',
        'Dashboard',
        mockResourceId,
      );

      expect(result.diff).toBeUndefined();
    });

    it('should include organizationId in the created log', async () => {
      const createdLog = { ...mockAuditLog };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      await service.log(ActorType.USER, 'CREATE', 'Project', mockResourceId);

      expect(mockManager.create).toHaveBeenCalledWith(AuditLog, {
        actorType: ActorType.USER,
        action: 'CREATE',
        resourceType: 'Project',
        resourceId: mockResourceId,
        diff: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        organizationId: mockOrganizationId,
      });
    });
  });

  describe('findAll', () => {
    const mockAuditLogs = [mockAuditLog];

    it('should return all audit logs for the organization', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockAuditLogs);

      const result = await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.find).toHaveBeenCalledWith(AuditLog, {
        order: { createdAt: 'DESC' },
        take: 100,
      });
      expect(result).toEqual(mockAuditLogs);
    });

    it('should return audit logs ordered by createdAt DESC', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockAuditLogs);

      await service.findAll();

      expect(mockManager.find).toHaveBeenCalledWith(AuditLog, {
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should respect custom limit parameter', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockAuditLogs);

      await service.findAll(50);

      expect(mockManager.find).toHaveBeenCalledWith(AuditLog, {
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });

    it('should use default limit of 100', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockAuditLogs);

      await service.findAll();

      expect(mockManager.find).toHaveBeenCalledWith(AuditLog, {
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should return empty array when no audit logs exist', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should return multiple audit logs', async () => {
      const multipleLogs = [
        { ...mockAuditLog, id: 'audit-1', action: 'CREATE' },
        { ...mockAuditLog, id: 'audit-2', action: 'UPDATE' },
        { ...mockAuditLog, id: 'audit-3', action: 'DELETE' },
      ];
      (mockManager.find as jest.Mock).mockResolvedValue(multipleLogs);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(result[0].action).toBe('CREATE');
    });
  });

  describe('findByResource', () => {
    const mockResourceType = 'Project';
    const mockAuditLogs = [
      { ...mockAuditLog, action: 'CREATE' },
      { ...mockAuditLog, action: 'UPDATE' },
    ];

    it('should return audit logs for a specific resource', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockAuditLogs);

      const result = await service.findByResource(mockResourceType, mockResourceId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.find).toHaveBeenCalledWith(AuditLog, {
        where: { resourceType: mockResourceType, resourceId: mockResourceId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockAuditLogs);
    });

    it('should filter by resourceType and resourceId', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockAuditLogs);

      await service.findByResource('Conversation', 'conv-123');

      expect(mockManager.find).toHaveBeenCalledWith(AuditLog, {
        where: { resourceType: 'Conversation', resourceId: 'conv-123' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should order by createdAt DESC', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockAuditLogs);

      await service.findByResource(mockResourceType, mockResourceId);

      expect(mockManager.find).toHaveBeenCalledWith(AuditLog, {
        where: { resourceType: mockResourceType, resourceId: mockResourceId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no logs exist for resource', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findByResource(mockResourceType, mockResourceId);

      expect(result).toEqual([]);
    });

    it('should return audit trail for a resource', async () => {
      const auditTrail = [
        { ...mockAuditLog, id: 'log-1', action: 'CREATE', createdAt: new Date('2024-01-01') },
        { ...mockAuditLog, id: 'log-2', action: 'UPDATE', createdAt: new Date('2024-01-02') },
        { ...mockAuditLog, id: 'log-3', action: 'UPDATE', createdAt: new Date('2024-01-03') },
      ];
      (mockManager.find as jest.Mock).mockResolvedValue(auditTrail);

      const result = await service.findByResource(mockResourceType, mockResourceId);

      expect(result).toHaveLength(3);
      expect(result[0].action).toBe('CREATE');
    });
  });

  describe('multi-tenancy', () => {
    it('should use runWithTenant for all database operations', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(typeof (tenancyService.runWithTenant as jest.Mock).mock.calls[0][0]).toBe(
        'function',
      );
    });

    it('should pass organization context through runWithTenant', async () => {
      const createdLog = { ...mockAuditLog };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      await service.log(ActorType.USER, 'CREATE', 'Project', mockResourceId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection error');
      (mockManager.find as jest.Mock).mockRejectedValue(dbError);

      await expect(service.findAll()).rejects.toThrow('Database connection error');
    });

    it('should handle save errors', async () => {
      const saveError = new Error('Save failed');
      (mockManager.save as jest.Mock).mockRejectedValue(saveError);
      (mockManager.create as jest.Mock).mockReturnValue(mockAuditLog);

      await expect(
        service.log(ActorType.USER, 'CREATE', 'Project', mockResourceId),
      ).rejects.toThrow('Save failed');
    });
  });

  describe('actor types', () => {
    it('should log USER action', async () => {
      const createdLog = { ...mockAuditLog, actorType: ActorType.USER };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(ActorType.USER, 'LOGIN', 'User', mockResourceId);

      expect(result.actorType).toBe(ActorType.USER);
    });

    it('should log SYSTEM action', async () => {
      const createdLog = { ...mockAuditLog, actorType: ActorType.SYSTEM };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(
        ActorType.SYSTEM,
        'CLEANUP',
        'Session',
        mockResourceId,
      );

      expect(result.actorType).toBe(ActorType.SYSTEM);
    });

    it('should log API_KEY action', async () => {
      const createdLog = { ...mockAuditLog, actorType: ActorType.API_KEY };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(
        ActorType.API_KEY,
        'REQUEST',
        'API',
        mockResourceId,
      );

      expect(result.actorType).toBe(ActorType.API_KEY);
    });
  });

  describe('audit actions', () => {
    it('should log CREATE action', async () => {
      const createdLog = { ...mockAuditLog, action: 'CREATE' };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(ActorType.USER, 'CREATE', 'Project', mockResourceId);

      expect(result.action).toBe('CREATE');
    });

    it('should log UPDATE action', async () => {
      const createdLog = { ...mockAuditLog, action: 'UPDATE' };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(ActorType.USER, 'UPDATE', 'Project', mockResourceId);

      expect(result.action).toBe('UPDATE');
    });

    it('should log DELETE action', async () => {
      const createdLog = { ...mockAuditLog, action: 'DELETE' };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(ActorType.USER, 'DELETE', 'Project', mockResourceId);

      expect(result.action).toBe('DELETE');
    });

    it('should log VIEW action', async () => {
      const createdLog = { ...mockAuditLog, action: 'VIEW' };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(ActorType.USER, 'VIEW', 'Dashboard', mockResourceId);

      expect(result.action).toBe('VIEW');
    });

    it('should log EXPORT action', async () => {
      const createdLog = { ...mockAuditLog, action: 'EXPORT' };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(
        ActorType.USER,
        'EXPORT',
        'Report',
        mockResourceId,
      );

      expect(result.action).toBe('EXPORT');
    });
  });

  describe('diff tracking', () => {
    it('should track field changes in diff', async () => {
      const diff = {
        title: { old: 'Old Title', new: 'New Title' },
        status: { old: 'draft', new: 'published' },
      };
      const createdLog = { ...mockAuditLog, diff };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(
        ActorType.USER,
        'UPDATE',
        'Project',
        mockResourceId,
        diff,
      );

      expect(result.diff).toEqual(diff);
    });

    it('should track nested object changes', async () => {
      const diff = {
        settings: {
          old: { theme: 'light', lang: 'en' },
          new: { theme: 'dark', lang: 'fr' },
        },
      };
      const createdLog = { ...mockAuditLog, diff };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(
        ActorType.USER,
        'UPDATE',
        'Settings',
        mockResourceId,
        diff,
      );

      expect(result.diff).toEqual(diff);
    });

    it('should track array changes', async () => {
      const diff = {
        scopes: {
          old: ['read'],
          new: ['read', 'write', 'delete'],
        },
      };
      const createdLog = { ...mockAuditLog, diff };
      (mockManager.create as jest.Mock).mockReturnValue(createdLog);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.log(
        ActorType.USER,
        'UPDATE',
        'ApiKey',
        mockResourceId,
        diff,
      );

      expect(result.diff).toEqual(diff);
    });
  });
});
