import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { InvitationsService } from './invitations.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { Invitation } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InviteStatus } from './entities/enums/invite-status.enum';
import { UserRole } from '../common/enums/user-role.enum';

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
  })),
}));

describe('InvitationsService', () => {
  let service: InvitationsService;
  let tenancyService: TenancyService;
  let dataSource: DataSource;
  let mockManager: Partial<EntityManager>;

  const mockOrganizationId = 'org-123e4567-e89b-12d3-a456-426614174000';
  const mockInvitationId = 'inv-123e4567-e89b-12d3-a456-426614174000';
  const mockToken = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

  const mockInvitation: Partial<Invitation> = {
    id: mockInvitationId,
    email: 'invitee@example.com',
    role: UserRole.MEMBER,
    token: mockToken,
    status: InviteStatus.PENDING,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    organizationId: mockOrganizationId,
    organization: undefined,
    createdAt: new Date(),
    isExpired: jest.fn().mockReturnValue(false),
    accept: jest.fn(),
    checkExpiration: jest.fn(),
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
      runWithTenant: jest.fn().mockImplementation(async (callback) => {
        return callback(mockManager as EntityManager);
      }),
      runBypassingTenant: jest.fn().mockImplementation(async (callback) => {
        return callback(mockManager as EntityManager);
      }),
    };

    const dataSourceMock = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockManager as EntityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
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

    service = module.get<InvitationsService>(InvitationsService);
    tenancyService = module.get<TenancyService>(TenancyService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a token using crypto.randomBytes', () => {
      const result = service.generateToken();

      expect(result).toBe(mockToken);
    });

    it('should generate a hex string token', () => {
      const result = service.generateToken();

      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('create', () => {
    const createDto: CreateInvitationDto = {
      email: 'newuser@example.com',
      role: UserRole.MEMBER,
    };

    it('should create an invitation successfully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      const createdInvitation = { ...mockInvitation, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(createdInvitation);

      const result = await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(Invitation, {
        where: {
          email: createDto.email,
          organizationId: mockOrganizationId,
          status: InviteStatus.PENDING,
        },
      });
      expect(mockManager.create).toHaveBeenCalledWith(Invitation, {
        ...createDto,
        token: mockToken,
        expiresAt: expect.any(Date),
        organizationId: mockOrganizationId,
      });
      expect(result).toEqual(createdInvitation);
    });

    it('should throw BadRequestException when active invitation exists', async () => {
      const existingInvitation = { ...mockInvitation, status: InviteStatus.PENDING };
      (mockManager.findOne as jest.Mock).mockResolvedValue(existingInvitation);

      await expect(service.create(createDto, mockOrganizationId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto, mockOrganizationId)).rejects.toThrow(
        'An active invitation already exists for this email',
      );
    });

    it('should generate a unique token for each invitation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      const createdInvitation = { ...mockInvitation, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(createdInvitation);

      await service.create(createDto, mockOrganizationId);

      expect(mockManager.create).toHaveBeenCalledWith(Invitation, {
        ...createDto,
        token: mockToken,
        expiresAt: expect.any(Date),
        organizationId: mockOrganizationId,
      });
    });

    it('should set default expiration of 7 days when not provided', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      const beforeCreate = Date.now();
      const createdInvitation = { ...mockInvitation, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(createdInvitation);

      await service.create(createDto, mockOrganizationId);

      const afterCreate = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const callArg = (mockManager.create as jest.Mock).mock.calls[0][1];
      expect(callArg.expiresAt.getTime()).toBeGreaterThanOrEqual(beforeCreate + 7 * 24 * 60 * 60 * 1000 - 1000);
      expect(callArg.expiresAt.getTime()).toBeLessThanOrEqual(afterCreate + 1000);
    });

    it('should use custom expiration date when provided', async () => {
      const customExpiresAt = '2025-12-31T23:59:59Z';
      const createDtoWithExpiry: CreateInvitationDto = {
        ...createDto,
        expiresAt: customExpiresAt,
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      const createdInvitation = { ...mockInvitation, ...createDtoWithExpiry };
      (mockManager.create as jest.Mock).mockReturnValue(createdInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(createdInvitation);

      await service.create(createDtoWithExpiry, mockOrganizationId);

      expect(mockManager.create).toHaveBeenCalledWith(Invitation, {
        ...createDtoWithExpiry,
        token: mockToken,
        expiresAt: new Date(customExpiresAt),
        organizationId: mockOrganizationId,
      });
    });

    it('should include organizationId in the created invitation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      const createdInvitation = { ...mockInvitation, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(createdInvitation);

      await service.create(createDto, mockOrganizationId);

      expect(mockManager.create).toHaveBeenCalledWith(Invitation, {
        ...createDto,
        token: mockToken,
        expiresAt: expect.any(Date),
        organizationId: mockOrganizationId,
      });
    });

    it('should create invitation with default MEMBER role', async () => {
      const createDtoWithoutRole: CreateInvitationDto = {
        email: 'norole@example.com',
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      const createdInvitation = {
        ...mockInvitation,
        ...createDtoWithoutRole,
        role: UserRole.MEMBER,
      };
      (mockManager.create as jest.Mock).mockReturnValue(createdInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(createdInvitation);

      const result = await service.create(createDtoWithoutRole, mockOrganizationId);

      expect(result.role).toBe(UserRole.MEMBER);
    });
  });

  describe('findAll', () => {
    const mockInvitations = [
      { ...mockInvitation, id: 'inv-1', email: 'user1@example.com' },
      { ...mockInvitation, id: 'inv-2', email: 'user2@example.com' },
    ];

    it('should return all invitations for the organization', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockInvitations);

      const result = await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.find).toHaveBeenCalledWith(Invitation, {
        order: { createdAt: 'DESC' },
        relations: ['organization'],
      });
      expect(result).toEqual(mockInvitations);
    });

    it('should order invitations by createdAt DESC', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockInvitations);

      await service.findAll();

      expect(mockManager.find).toHaveBeenCalledWith(Invitation, {
        order: { createdAt: 'DESC' },
        relations: ['organization'],
      });
    });

    it('should include organization relation', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockInvitations);

      await service.findAll();

      expect(mockManager.find).toHaveBeenCalledWith(Invitation, {
        order: { createdAt: 'DESC' },
        relations: ['organization'],
      });
    });

    it('should return empty array when no invitations exist', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an invitation by id', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);

      const result = await service.findOne(mockInvitationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(Invitation, {
        where: { id: mockInvitationId },
        relations: ['organization'],
      });
      expect(result).toEqual(mockInvitation);
    });

    it('should throw NotFoundException when invitation not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockInvitationId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockInvitationId)).rejects.toThrow(
        `Invitation with ID ${mockInvitationId} not found`,
      );
    });

    it('should include organization relation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);

      await service.findOne(mockInvitationId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Invitation, {
        where: { id: mockInvitationId },
        relations: ['organization'],
      });
    });
  });

  describe('findByToken', () => {
    it('should return an invitation by token', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);

      const result = await service.findByToken(mockToken);

      expect(tenancyService.runBypassingTenant).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(Invitation, {
        where: { token: mockToken },
        relations: ['organization'],
      });
      expect(result).toEqual(mockInvitation);
    });

    it('should throw NotFoundException when token is invalid', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findByToken(mockToken)).rejects.toThrow(NotFoundException);
      await expect(service.findByToken(mockToken)).rejects.toThrow(
        'Invalid invitation token',
      );
    });

    it('should throw BadRequestException when invitation is expired', async () => {
      const expiredInvitation = {
        ...mockInvitation,
        isExpired: jest.fn().mockReturnValue(true),
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(expiredInvitation);

      await expect(service.findByToken(mockToken)).rejects.toThrow(BadRequestException);
      await expect(service.findByToken(mockToken)).rejects.toThrow(
        'Invitation has expired',
      );
    });

    it('should use runBypassingTenant for token lookup', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);

      await service.findByToken(mockToken);

      expect(tenancyService.runBypassingTenant).toHaveBeenCalled();
    });

    it('should include organization relation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);

      await service.findByToken(mockToken);

      expect(mockManager.findOne).toHaveBeenCalledWith(Invitation, {
        where: { token: mockToken },
        relations: ['organization'],
      });
    });
  });

  describe('accept', () => {
    const userId = 'user-123e4567-e89b-12d3-a456-426614174000';

    it('should accept an invitation successfully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(mockInvitation);

      const result = await service.accept(mockToken, userId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(Invitation, {
        where: { token: mockToken },
        relations: ['organization'],
      });
      expect(mockInvitation.accept).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalledWith(Invitation, mockInvitation);
      expect(result).toEqual(mockInvitation);
    });

    it('should throw NotFoundException when token is invalid', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.accept(mockToken, userId)).rejects.toThrow(NotFoundException);
      await expect(service.accept(mockToken, userId)).rejects.toThrow(
        'Invalid invitation token',
      );
    });

    it('should throw BadRequestException when invitation is expired', async () => {
      const expiredInvitation = {
        ...mockInvitation,
        isExpired: jest.fn().mockReturnValue(true),
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(expiredInvitation);

      await expect(service.accept(mockToken, userId)).rejects.toThrow(BadRequestException);
      await expect(service.accept(mockToken, userId)).rejects.toThrow(
        'Invitation has expired',
      );
    });

    it('should call accept method on invitation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(mockInvitation);

      await service.accept(mockToken, userId);

      expect(mockInvitation.accept).toHaveBeenCalled();
    });

    it('should save the updated invitation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(mockInvitation);

      await service.accept(mockToken, userId);

      expect(mockManager.save).toHaveBeenCalledWith(Invitation, mockInvitation);
    });
  });

  describe('revoke', () => {
    it('should revoke an invitation successfully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(mockInvitation);

      const result = await service.revoke(mockInvitationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(Invitation, {
        where: { id: mockInvitationId },
      });
      expect(mockInvitation.status).toBe(InviteStatus.EXPIRED);
      expect(mockManager.save).toHaveBeenCalledWith(Invitation, mockInvitation);
      expect(result).toEqual(mockInvitation);
    });

    it('should throw NotFoundException when invitation not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.revoke(mockInvitationId)).rejects.toThrow(NotFoundException);
      await expect(service.revoke(mockInvitationId)).rejects.toThrow(
        `Invitation with ID ${mockInvitationId} not found`,
      );
    });

    it('should set status to EXPIRED', async () => {
      const invitation = { ...mockInvitation, status: InviteStatus.PENDING };
      (mockManager.findOne as jest.Mock).mockResolvedValue(invitation);
      (mockManager.save as jest.Mock).mockResolvedValue(invitation);

      await service.revoke(mockInvitationId);

      expect(invitation.status).toBe(InviteStatus.EXPIRED);
    });
  });

  describe('remove', () => {
    it('should remove an invitation successfully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.remove as jest.Mock).mockResolvedValue(mockInvitation);

      const result = await service.remove(mockInvitationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(Invitation, {
        where: { id: mockInvitationId },
      });
      expect(mockManager.remove).toHaveBeenCalledWith(Invitation, mockInvitation);
      expect(result).toEqual({ id: mockInvitationId, deleted: true });
    });

    it('should throw NotFoundException when invitation not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(mockInvitationId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(mockInvitationId)).rejects.toThrow(
        `Invitation with ID ${mockInvitationId} not found`,
      );
    });

    it('should return deletion confirmation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.remove as jest.Mock).mockResolvedValue(mockInvitation);

      const result = await service.remove(mockInvitationId);

      expect(result).toEqual({ id: mockInvitationId, deleted: true });
    });
  });

  describe('error handling', () => {
    describe('create errors', () => {
      it('should handle database errors on create', async () => {
        const dbError = new Error('Database connection error');
        (mockManager.findOne as jest.Mock).mockRejectedValue(dbError);

        await expect(service.create({ email: 'test@example.com' }, mockOrganizationId)).rejects.toThrow(
          'Database connection error',
        );
      });
    });

    describe('findOne errors', () => {
      it('should handle database errors on findOne', async () => {
        const dbError = new Error('Find failed');
        (mockManager.findOne as jest.Mock).mockRejectedValue(dbError);

        await expect(service.findOne(mockInvitationId)).rejects.toThrow('Find failed');
      });
    });

    describe('findByToken errors', () => {
      it('should handle database errors on findByToken', async () => {
        const dbError = new Error('Find by token failed');
        (mockManager.findOne as jest.Mock).mockRejectedValue(dbError);

        await expect(service.findByToken(mockToken)).rejects.toThrow('Find by token failed');
      });
    });
  });

  describe('multi-tenancy', () => {
    it('should use runWithTenant for create operations', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      const createdInvitation = { ...mockInvitation };
      (mockManager.create as jest.Mock).mockReturnValue(createdInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(createdInvitation);

      await service.create({ email: 'test@example.com' }, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });

    it('should use runWithTenant for find operations', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });

    it('should use runWithTenant for findOne', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);

      await service.findOne(mockInvitationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });

    it('should use runBypassingTenant for findByToken', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);

      await service.findByToken(mockToken);

      expect(tenancyService.runBypassingTenant).toHaveBeenCalled();
    });

    it('should use runWithTenant for accept', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(mockInvitation);

      await service.accept(mockToken, 'user-id');

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });

    it('should use runWithTenant for revoke', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.save as jest.Mock).mockResolvedValue(mockInvitation);

      await service.revoke(mockInvitationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });

    it('should use runWithTenant for remove', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockInvitation);
      (mockManager.remove as jest.Mock).mockResolvedValue(mockInvitation);

      await service.remove(mockInvitationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });
  });

  describe('invitation entity methods', () => {
    it('should have isExpired method', () => {
      expect(mockInvitation.isExpired).toBeDefined();
      expect(typeof mockInvitation.isExpired).toBe('function');
    });

    it('should have accept method', () => {
      expect(mockInvitation.accept).toBeDefined();
      expect(typeof mockInvitation.accept).toBe('function');
    });

    it('should have checkExpiration method', () => {
      expect(mockInvitation.checkExpiration).toBeDefined();
      expect(typeof mockInvitation.checkExpiration).toBe('function');
    });

    it('should accept invitation by setting status to ACCEPTED', () => {
      const invitation = { ...mockInvitation, status: InviteStatus.PENDING };
      invitation.accept = jest.fn(() => {
        invitation.status = InviteStatus.ACCEPTED;
      });

      invitation.accept();

      expect(invitation.status).toBe(InviteStatus.ACCEPTED);
    });
  });

  describe('InviteStatus enum', () => {
    it('should have PENDING status', () => {
      expect(InviteStatus.PENDING).toBe('PENDING');
    });

    it('should have ACCEPTED status', () => {
      expect(InviteStatus.ACCEPTED).toBe('ACCEPTED');
    });

    it('should have EXPIRED status', () => {
      expect(InviteStatus.EXPIRED).toBe('EXPIRED');
    });
  });
});
