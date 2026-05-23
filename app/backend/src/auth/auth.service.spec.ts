import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Locale } from '../common/enums/locale.enum';
import { ValidatedUser } from './interfaces/jwt-payload.interface';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let organizationsService: OrganizationsService;
  let jwtService: JwtService;

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
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockOrganizationsService = {
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockEntityManager = {};
  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockEntityManager);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    organizationsService = module.get<OrganizationsService>(OrganizationsService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'SecurePass123!';

    it('should return user without passwordHash when credentials are valid', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.passwordHash);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
        locale: mockUser.locale,
        emailVerified: mockUser.emailVerified,
        isActive: mockUser.isActive,
        lastLoginAt: mockUser.lastLoginAt,
        organizationId: mockUser.organizationId,
        organization: mockUser.organization,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result?.passwordHash).toBeUndefined();
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should call findByEmail with correct email', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await service.validateUser(email, password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should call bcrypt.compare with password and passwordHash', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await service.validateUser(email, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.passwordHash);
    });
  });

  describe('login', () => {
    const user: ValidatedUser = {
      id: 'user-123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: UserRole.MEMBER,
      lastLoginAt: null,
      organizationId: 'org-123e4567-e89b-12d3-a456-426614174000',
      organization: { id: 'org-123e4567-e89b-12d3-a456-426614174000', name: 'Test Org' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockToken = 'jwt-token-12345';

    it('should return access token on successful login', async () => {
      mockJwtService.sign.mockReturnValue(mockToken);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
        role: user.role,
        orgId: user.organizationId,
      });
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({ access_token: mockToken });
    });

    it('should create JWT payload with correct claims', async () => {
      mockJwtService.sign.mockReturnValue(mockToken);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 'user-123e4567-e89b-12d3-a456-426614174000',
        role: UserRole.MEMBER,
        orgId: 'org-123e4567-e89b-12d3-a456-426614174000',
      });
    });

    it('should call updateLastLogin with user id', async () => {
      mockJwtService.sign.mockReturnValue(mockToken);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      await service.login(user);

      expect(usersService.updateLastLogin).toHaveBeenCalledWith('user-123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return object with access_token property', async () => {
      mockJwtService.sign.mockReturnValue(mockToken);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.login(user);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe(mockToken);
    });

    it('should work with different user roles', async () => {
      const adminUser: ValidatedUser = {
        ...user,
        role: UserRole.ADMIN,
      };
      mockJwtService.sign.mockReturnValue(mockToken);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      await service.login(adminUser);

      expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({
        role: UserRole.ADMIN,
      }));
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      organizationName: 'New Organization',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockOrg = {
      id: 'org-new-123',
      name: 'New Organization',
    };

    const mockCreatedUser = {
      ...mockUser,
      id: 'user-new-123',
      email: registerDto.email,
      firstName: 'John',
      lastName: 'Doe',
      organization: mockOrg,
      organizationId: mockOrg.id,
    };

    it('should register a new user successfully', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockOrganizationsService.create.mockResolvedValue(mockOrg);
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(organizationsService.create).toHaveBeenCalledWith(registerDto.organizationName, mockEntityManager);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: 'new-hash',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        organizationId: mockOrg.id,
        organization: mockOrg,
        role: UserRole.OWNER,
      }, mockEntityManager);
      expect(result.passwordHash).toBeUndefined();
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Email already in use');
    });

    it('should create organization with provided name', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockOrganizationsService.create.mockResolvedValue(mockOrg);
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      await service.register(registerDto);

      expect(organizationsService.create).toHaveBeenCalledWith(registerDto.organizationName, mockEntityManager);
    });

    it('should create organization with default name when not provided', async () => {
      const registerDtoWithoutOrg = {
        email: 'noorg@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockOrganizationsService.create.mockResolvedValue(mockOrg);
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      await service.register(registerDtoWithoutOrg);

      expect(organizationsService.create).toHaveBeenCalledWith("John Doe's Org", mockEntityManager);
    });

    it('should hash password with saltRounds of 10', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockOrganizationsService.create.mockResolvedValue(mockOrg);
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should create user with organization and organizationId', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockOrganizationsService.create.mockResolvedValue(mockOrg);
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: mockOrg.id,
        organization: mockOrg,
      }), mockEntityManager);
    });

    it('should return user without passwordHash', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockOrganizationsService.create.mockResolvedValue(mockOrg);
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      const result = await service.register(registerDto);

      expect(result.passwordHash).toBeUndefined();
    });

    it('should return user with all properties except passwordHash', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockOrganizationsService.create.mockResolvedValue(mockOrg);
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        id: mockCreatedUser.id,
        email: mockCreatedUser.email,
        firstName: mockCreatedUser.firstName,
        lastName: mockCreatedUser.lastName,
        fullName: mockCreatedUser.fullName,
        role: mockCreatedUser.role,
        locale: mockCreatedUser.locale,
        emailVerified: mockCreatedUser.emailVerified,
        isActive: mockCreatedUser.isActive,
        lastLoginAt: mockCreatedUser.lastLoginAt,
        organizationId: mockCreatedUser.organizationId,
        organization: mockCreatedUser.organization,
        createdAt: mockCreatedUser.createdAt,
        updatedAt: mockCreatedUser.updatedAt,
      });
    });
  });

  describe('error handling', () => {
    describe('validateUser errors', () => {
      it('should handle database errors gracefully', async () => {
        const dbError = new Error('Database connection error');
        mockUsersService.findByEmail.mockRejectedValue(dbError);

        await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(
          'Database connection error',
        );
      });

      it('should handle bcrypt errors', async () => {
        const bcrypt = require('bcrypt');
        const bcryptError = new Error('Bcrypt error');
        (bcrypt.compare as jest.Mock).mockRejectedValue(bcryptError);
        mockUsersService.findByEmail.mockResolvedValue(mockUser);

        await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(
          'Bcrypt error',
        );
      });
    });

    describe('register errors', () => {
      it('should throw ConflictException when email already exists', async () => {
        mockUsersService.findByEmail.mockResolvedValue(mockUser);

        await expect(service.register({ email: 'test@example.com', password: 'SecurePass123!' })).rejects.toThrow(ConflictException);
        await expect(service.register({ email: 'test@example.com', password: 'SecurePass123!' })).rejects.toThrow('Email already in use');
      });

      it('should handle organization creation errors', async () => {
        const bcrypt = require('bcrypt');
        (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
        mockUsersService.findByEmail.mockResolvedValue(null);
        const orgError = new Error('Organization creation failed');
        mockOrganizationsService.create.mockRejectedValue(orgError);

        await expect(service.register({ email: 'test@example.com', password: 'SecurePass123!' })).rejects.toThrow(
          'Organization creation failed',
        );
      });

      it('should handle user creation errors', async () => {
        const bcrypt = require('bcrypt');
        (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
        mockUsersService.findByEmail.mockResolvedValue(null);
        mockOrganizationsService.create.mockResolvedValue({ id: 'org-123', name: 'Test Org' });
        const userError = new Error('User creation failed');
        mockUsersService.create.mockRejectedValue(userError);

        await expect(service.register({ email: 'test@example.com', password: 'SecurePass123!' })).rejects.toThrow(
          'User creation failed',
        );
      });
    });
  });

  describe('password hashing', () => {
    it('should hash password during registration', async () => {
      const bcrypt = require('bcrypt');
      const mockHash = 'hashed-value-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockOrganizationsService.create.mockResolvedValue({ id: 'org-123', name: 'Test Org' });
      mockUsersService.create.mockResolvedValue(mockUser);

      await service.register({ email: 'test@example.com', password: 'SecurePass123!' });

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: mockHash,
        }),
        mockEntityManager,
      );
    });
  });

  describe('JWT token generation', () => {
    it('should generate token with correct payload structure', async () => {
      const user: ValidatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ADMIN,
        lastLoginAt: null,
        organizationId: 'org-123',
        organization: { id: 'org-123', name: 'Test Org' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockJwtService.sign.mockReturnValue('token');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 'user-123',
        role: UserRole.ADMIN,
        orgId: 'org-123',
      });
    });
  });

  describe('integration scenarios', () => {
    it('should complete full registration flow', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockOrganizationsService.create.mockResolvedValue({ id: 'org-123', name: 'Org' });
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register({ email: 'test@example.com', password: 'SecurePass123!' });

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should complete full login flow', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('token');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const validateResult = await service.validateUser('test@example.com', 'password');
      expect(validateResult).toBeDefined();

      if (validateResult) {
        const loginResult = await service.login(validateResult);
        expect(loginResult.access_token).toBe('token');
      }
    });
  });
});
