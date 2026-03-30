import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserRole } from './entities/user.entity';
import { Locale } from '../projects/entities/enums/locale.enum';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockOrganization: Partial<Organization> = {
    id: 'org-123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Organization',
    slug: 'test-org',
  };

  const mockUser: Partial<User> = {
    id: 'user-123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    fullName: 'Test User',
    passwordHash: 'hashed-password-123',
    role: UserRole.MEMBER,
    locale: Locale.EN,
    emailVerified: false,
    isActive: true,
    lastLoginAt: null,
    organizationId: mockOrganization.id,
    organization: mockOrganization as Organization,
    createdAt: new Date(),
    updatedAt: new Date(),
    canAccess: jest.fn().mockReturnValue(true),
    deactivate: jest.fn(),
  };

  const mockRepository: Partial<Repository<User>> = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email },
        relations: ['organization'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      const email = 'notfound@example.com';
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });

    it('should include organization relation when finding by email', async () => {
      const email = 'with-org@example.com';
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await service.findByEmail(email);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email },
        relations: ['organization'],
      });
    });

    it('should return user with all properties', async () => {
      const email = 'complete@example.com';
      const completeUser = {
        ...mockUser,
        email,
        id: 'user-complete',
      };
      (mockRepository.findOne as jest.Mock).mockResolvedValue(completeUser);

      const result = await service.findByEmail(email);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('fullName');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('organization');
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const userId = 'user-123e4567-e89b-12d3-a456-426614174000';
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findById(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['organization'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by id', async () => {
      const userId = 'non-existent-id';
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findById(userId);

      expect(result).toBeNull();
    });

    it('should include organization relation when finding by id', async () => {
      const userId = 'user-with-org';
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await service.findById(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['organization'],
      });
    });

    it('should return user with organization data', async () => {
      const userId = 'user-full';
      const userWithOrg = {
        ...mockUser,
        id: userId,
        organization: mockOrganization as Organization,
      };
      (mockRepository.findOne as jest.Mock).mockResolvedValue(userWithOrg);

      const result = await service.findById(userId);

      expect(result?.organization).toBeDefined();
      expect(result?.organization?.id).toBe(mockOrganization.id);
    });
  });

  describe('create', () => {
    const userData: Partial<User> = {
      email: 'newuser@example.com',
      passwordHash: 'new-hash',
      organizationId: mockOrganization.id,
    };

    it('should create a user successfully', async () => {
      const createdUser = { ...mockUser, ...userData };
      (mockRepository.create as jest.Mock).mockReturnValue(createdUser);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(userData);

      expect(mockRepository.create).toHaveBeenCalledWith(userData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });

    it('should create user with default values', async () => {
      const minimalData: Partial<User> = {
        email: 'minimal@example.com',
        passwordHash: 'hash',
        organizationId: mockOrganization.id,
      };
      const createdUser = {
        ...mockUser,
        ...minimalData,
        role: UserRole.MEMBER,
        locale: Locale.EN,
        emailVerified: false,
        isActive: true,
      };
      (mockRepository.create as jest.Mock).mockReturnValue(createdUser);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(minimalData);

      expect(result.role).toBe(UserRole.MEMBER);
      expect(result.locale).toBe(Locale.EN);
      expect(result.emailVerified).toBe(false);
      expect(result.isActive).toBe(true);
    });

    it('should create user with custom role', async () => {
      const adminData: Partial<User> = {
        email: 'admin@example.com',
        passwordHash: 'hash',
        organizationId: mockOrganization.id,
        role: UserRole.ADMIN,
      };
      const createdUser = { ...mockUser, ...adminData };
      (mockRepository.create as jest.Mock).mockReturnValue(createdUser);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(adminData);

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should create user with organization', async () => {
      const userDataWithOrg: Partial<User> = {
        email: 'org-user@example.com',
        passwordHash: 'hash',
        organizationId: mockOrganization.id,
        organization: mockOrganization as Organization,
      };
      const createdUser = { ...mockUser, ...userDataWithOrg };
      (mockRepository.create as jest.Mock).mockReturnValue(createdUser);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(userDataWithOrg);

      expect(result.organization).toBeDefined();
      expect(result.organizationId).toBe(mockOrganization.id);
    });

    it('should save the user to the repository', async () => {
      const createdUser = { ...mockUser, ...userData };
      (mockRepository.create as jest.Mock).mockReturnValue(createdUser);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdUser);

      await service.create(userData);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateLastLogin', () => {
    it('should update lastLoginAt for a user', async () => {
      const userId = 'user-123e4567-e89b-12d3-a456-426614174000';
      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await service.updateLastLogin(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        lastLoginAt: expect.any(Date),
      });
    });

    it('should set lastLoginAt to current date', async () => {
      const userId = 'user-login';
      const beforeUpdate = new Date();
      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await service.updateLastLogin(userId);

      const afterUpdate = new Date();
      const callArg = (mockRepository.update as jest.Mock).mock.calls[0][1];
      expect(callArg.lastLoginAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(callArg.lastLoginAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });

    it('should update the correct user by id', async () => {
      const userId = 'specific-user-id';
      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await service.updateLastLogin(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, expect.any(Object));
    });
  });

  describe('error handling', () => {
    it('should handle database errors on findByEmail', async () => {
      const dbError = new Error('Database connection error');
      (mockRepository.findOne as jest.Mock).mockRejectedValue(dbError);

      await expect(service.findByEmail('test@example.com')).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle database errors on findById', async () => {
      const dbError = new Error('Find failed');
      (mockRepository.findOne as jest.Mock).mockRejectedValue(dbError);

      await expect(service.findById('user-id')).rejects.toThrow('Find failed');
    });

    it('should handle database errors on create', async () => {
      const dbError = new Error('Save failed');
      const userData: Partial<User> = {
        email: 'error@example.com',
        passwordHash: 'hash',
      };
      (mockRepository.create as jest.Mock).mockReturnValue({ ...mockUser, ...userData });
      (mockRepository.save as jest.Mock).mockRejectedValue(dbError);

      await expect(service.create(userData)).rejects.toThrow('Save failed');
    });

    it('should handle database errors on updateLastLogin', async () => {
      const dbError = new Error('Update failed');
      (mockRepository.update as jest.Mock).mockRejectedValue(dbError);

      await expect(service.updateLastLogin('user-id')).rejects.toThrow('Update failed');
    });

    it('should handle unique constraint violations on create', async () => {
      const constraintError = new Error('duplicate key value violates unique constraint');
      const userData: Partial<User> = {
        email: 'duplicate@example.com',
        passwordHash: 'hash',
      };
      (mockRepository.create as jest.Mock).mockReturnValue({ ...mockUser, ...userData });
      (mockRepository.save as jest.Mock).mockRejectedValue(constraintError);

      await expect(service.create(userData)).rejects.toThrow(
        'duplicate key value violates unique constraint',
      );
    });
  });

  describe('user entity methods', () => {
    it('should have canAccess method', () => {
      expect(mockUser.canAccess).toBeDefined();
      expect(typeof mockUser.canAccess).toBe('function');
    });

    it('should have deactivate method', () => {
      expect(mockUser.deactivate).toBeDefined();
      expect(typeof mockUser.deactivate).toBe('function');
    });

    it('should return true for OWNER role in canAccess', () => {
      const ownerUser = {
        ...mockUser,
        role: UserRole.OWNER,
        isActive: false,
      };
      ownerUser.canAccess = jest.fn().mockReturnValue(true);

      expect(ownerUser.canAccess('resource')).toBe(true);
    });

    it('should return true for ADMIN role in canAccess', () => {
      const adminUser = {
        ...mockUser,
        role: UserRole.ADMIN,
        isActive: false,
      };
      adminUser.canAccess = jest.fn().mockReturnValue(true);

      expect(adminUser.canAccess('resource')).toBe(true);
    });

    it('should return true for active MEMBER in canAccess', () => {
      const memberUser = {
        ...mockUser,
        role: UserRole.MEMBER,
        isActive: true,
      };
      memberUser.canAccess = jest.fn().mockReturnValue(true);

      expect(memberUser.canAccess('resource')).toBe(true);
    });

    it('should deactivate user by setting isActive to false', () => {
      const user = { ...mockUser, isActive: true };
      user.deactivate = jest.fn(() => {
        user.isActive = false;
      });

      user.deactivate();

      expect(user.isActive).toBe(false);
    });
  });

  describe('UserRole enum', () => {
    it('should have OWNER role', () => {
      expect(UserRole.OWNER).toBe('OWNER');
    });

    it('should have ADMIN role', () => {
      expect(UserRole.ADMIN).toBe('ADMIN');
    });

    it('should have MEMBER role', () => {
      expect(UserRole.MEMBER).toBe('MEMBER');
    });

    it('should have VIEWER role', () => {
      expect(UserRole.VIEWER).toBe('VIEWER');
    });
  });

  describe('user properties', () => {
    it('should create user with all required properties', async () => {
      const userData: Partial<User> = {
        email: 'complete@example.com',
        passwordHash: 'hash',
        organizationId: mockOrganization.id,
      };
      const createdUser = {
        ...mockUser,
        ...userData,
        id: 'user-complete',
      };
      (mockRepository.create as jest.Mock).mockReturnValue(createdUser);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(userData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('passwordHash');
      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should allow optional fullName to be null', async () => {
      const userData: Partial<User> = {
        email: 'no-name@example.com',
        passwordHash: 'hash',
        organizationId: mockOrganization.id,
        fullName: null,
      };
      const createdUser = { ...mockUser, ...userData, fullName: null };
      (mockRepository.create as jest.Mock).mockReturnValue(createdUser);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(userData);

      expect(result.fullName).toBeNull();
    });

    it('should allow lastLoginAt to be null', async () => {
      const userData: Partial<User> = {
        email: 'new-login@example.com',
        passwordHash: 'hash',
        organizationId: mockOrganization.id,
      };
      const createdUser = { ...mockUser, ...userData, lastLoginAt: null };
      (mockRepository.create as jest.Mock).mockReturnValue(createdUser);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(userData);

      expect(result.lastLoginAt).toBeNull();
    });
  });

  describe('relations', () => {
    it('should load user with organization relation', async () => {
      const userId = 'user-with-org';
      const userWithOrg = {
        ...mockUser,
        id: userId,
        organization: mockOrganization as Organization,
      };
      (mockRepository.findOne as jest.Mock).mockResolvedValue(userWithOrg);

      const result = await service.findById(userId);

      expect(result?.organization).toBeDefined();
      expect(result?.organization?.name).toBe('Test Organization');
    });

    it('should create user with organization reference', async () => {
      const userData: Partial<User> = {
        email: 'ref@example.com',
        passwordHash: 'hash',
        organizationId: mockOrganization.id,
        organization: mockOrganization as Organization,
      };
      const createdUser = { ...mockUser, ...userData };
      (mockRepository.create as jest.Mock).mockReturnValue(createdUser);
      (mockRepository.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(userData);

      expect(result.organization).toBeDefined();
    });
  });
});
