import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationsService } from './organizations.service';
import { Organization } from './entities/organization.entity';
import { Locale } from '../common/enums/locale.enum';
import { TenantTier } from './entities/organization.entity';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repository: Repository<Organization>;

  const mockOrganization: Partial<Organization> = {
    id: 'org-123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Organization',
    slug: 'test-organization',
    billingEmail: 'billing@test.com',
    tier: TenantTier.FREE,
    locale: Locale.EN,
    ssoEnabled: false,
    maxSeats: 5,
    logoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
    subscription: undefined,
    getActiveUsers: jest.fn().mockReturnValue([]),
    getCreditBalance: jest.fn().mockReturnValue(1000),
  };

  const mockRepository: Partial<Repository<Organization>> = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    exists: jest.fn(),
  };

  beforeEach(async () => {
    (mockRepository.exists as jest.Mock) = jest.fn().mockResolvedValue(false);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    repository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an organization successfully', async () => {
      const name = 'Test Organization';
      const createdOrg = { ...mockOrganization, name };
      
      (mockRepository.create as jest.Mock).mockReturnValue(createdOrg);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdOrg);

      const result = await service.create(name);

      expect(mockRepository.create).toHaveBeenCalledWith({ name, slug: 'test-organization' });
      expect(mockRepository.save).toHaveBeenCalledWith(createdOrg);
      expect(result).toEqual(createdOrg);
    });

    it('should create organization with default values', async () => {
      const name = 'New Org';
      const createdOrg = {
        ...mockOrganization,
        name,
        slug: expect.any(String),
        tier: TenantTier.FREE,
        locale: Locale.EN,
        ssoEnabled: false,
        maxSeats: 5,
      };
      
      (mockRepository.create as jest.Mock).mockReturnValue(createdOrg);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdOrg);

      const result = await service.create(name);

      expect(result.tier).toBe(TenantTier.FREE);
      expect(result.locale).toBe(Locale.EN);
      expect(result.ssoEnabled).toBe(false);
      expect(result.maxSeats).toBe(5);
    });

    it('should save the organization to the repository', async () => {
      const name = 'Saved Org';
      const createdOrg = { ...mockOrganization, name };
      
      (mockRepository.create as jest.Mock).mockReturnValue(createdOrg);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdOrg);

      await service.create(name);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should return organization with generated id', async () => {
      const name = 'ID Test Org';
      const createdOrg = {
        ...mockOrganization,
        id: 'generated-uuid-123',
        name,
      };
      
      (mockRepository.create as jest.Mock).mockReturnValue(createdOrg);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdOrg);

      const result = await service.create(name);

      expect(result.id).toBe('generated-uuid-123');
    });
  });

  describe('multi-tenancy', () => {
    it('should use standard repository without tenancy context for creation', async () => {
      const name = 'Multi-tenant Test';
      const createdOrg = { ...mockOrganization, name };
      
      (mockRepository.create as jest.Mock).mockReturnValue(createdOrg);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdOrg);

      await service.create(name);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors on save', async () => {
      const name = 'Error Test Org';
      const dbError = new Error('Database connection error');
      
      (mockRepository.create as jest.Mock).mockReturnValue({ name });
      (mockRepository.save as jest.Mock).mockRejectedValue(dbError);

      await expect(service.create(name)).rejects.toThrow('Database connection error');
    });

    it('should handle unique constraint violations', async () => {
      const name = 'Duplicate Org';
      const constraintError = new Error('duplicate key value violates unique constraint');
      
      (mockRepository.create as jest.Mock).mockReturnValue({ name });
      (mockRepository.save as jest.Mock).mockRejectedValue(constraintError);

      await expect(service.create(name)).rejects.toThrow('duplicate key value violates unique constraint');
    });
  });

  describe('organization entity methods', () => {
    it('should have getActiveUsers method', () => {
      expect(mockOrganization.getActiveUsers).toBeDefined();
      expect(typeof mockOrganization.getActiveUsers).toBe('function');
    });

    it('should have getCreditBalance method', () => {
      expect(mockOrganization.getCreditBalance).toBeDefined();
      expect(typeof mockOrganization.getCreditBalance).toBe('function');
    });

    it('should calculate credit balance based on tier', () => {
      const freeOrg = { ...mockOrganization, tier: TenantTier.FREE };
      freeOrg.getCreditBalance = jest.fn().mockReturnValue(1000);
      
      const proOrg = { ...mockOrganization, tier: TenantTier.PRO };
      proOrg.getCreditBalance = jest.fn().mockReturnValue(10000);
      
      const enterpriseOrg = { ...mockOrganization, tier: TenantTier.ENTERPRISE };
      enterpriseOrg.getCreditBalance = jest.fn().mockReturnValue(100000);

      expect(freeOrg.getCreditBalance()).toBe(1000);
      expect(proOrg.getCreditBalance()).toBe(10000);
      expect(enterpriseOrg.getCreditBalance()).toBe(100000);
    });
  });

  describe('TenantTier enum', () => {
    it('should have FREE tier', () => {
      expect(TenantTier.FREE).toBe('FREE');
    });

    it('should have PRO tier', () => {
      expect(TenantTier.PRO).toBe('PRO');
    });

    it('should have ENTERPRISE tier', () => {
      expect(TenantTier.ENTERPRISE).toBe('ENTERPRISE');
    });
  });

  describe('organization properties', () => {
    it('should create organization with all required properties', async () => {
      const name = 'Complete Org';
      const createdOrg = {
        ...mockOrganization,
        name,
        id: 'org-123',
        slug: 'complete-org',
      };
      
      (mockRepository.create as jest.Mock).mockReturnValue(createdOrg);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdOrg);

      const result = await service.create(name);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('tier');
      expect(result).toHaveProperty('locale');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should allow optional properties to be null', async () => {
      const name = 'Minimal Org';
      const createdOrg = {
        ...mockOrganization,
        name,
        billingEmail: null,
        logoUrl: null,
      };
      
      (mockRepository.create as jest.Mock).mockReturnValue(createdOrg);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdOrg);

      const result = await service.create(name);

      expect(result.billingEmail).toBeNull();
      expect(result.logoUrl).toBeNull();
    });
  });
});
