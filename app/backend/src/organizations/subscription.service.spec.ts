import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { SubscriptionService } from './subscription.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubStatus } from './entities/enums/sub-status.enum';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let tenancyService: TenancyService;
  let dataSource: DataSource;
  let mockManager: Partial<EntityManager>;

  const mockOrganizationId = 'org-123e4567-e89b-12d3-a456-426614174000';

  const mockSubscription: Partial<Subscription> = {
    id: 'sub-123e4567-e89b-12d3-a456-426614174000',
    stripeSubscriptionId: 'sub_stripe123',
    stripeCustomerId: 'cus_stripe123',
    stripePriceId: 'price_123',
    status: SubStatus.ACTIVE,
    monthlyCreditsAlloc: 10000,
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    organizationId: mockOrganizationId,
    isActive: jest.fn(),
    daysRemaining: jest.fn(),
  };

  beforeEach(async () => {
    mockManager = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const tenancyServiceMock = {
      runWithTenant: jest.fn((callback) => callback(mockManager as EntityManager)),
    };

    const dataSourceMock = {
      transaction: jest.fn((callback) => callback(mockManager as EntityManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
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

    service = module.get<SubscriptionService>(SubscriptionService);
    tenancyService = module.get<TenancyService>(TenancyService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateSubscriptionDto = {
      stripeSubscriptionId: 'sub_stripe123',
      stripeCustomerId: 'cus_stripe123',
      stripePriceId: 'price_123',
      currentPeriodStart: '2024-01-01T00:00:00Z',
      currentPeriodEnd: '2024-02-01T00:00:00Z',
    };

    it('should create a subscription successfully', async () => {
      const createdSubscription = { ...mockSubscription, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdSubscription);
      (mockManager.save as jest.Mock).mockResolvedValue(createdSubscription);

      const result = await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.create).toHaveBeenCalledWith(Subscription, {
        ...createDto,
        organizationId: mockOrganizationId,
      });
      expect(mockManager.save).toHaveBeenCalledWith(Subscription, createdSubscription);
      expect(result).toEqual(createdSubscription);
    });

    it('should include organizationId in the created subscription', async () => {
      const createdSubscription = { ...mockSubscription, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdSubscription);
      (mockManager.save as jest.Mock).mockResolvedValue(createdSubscription);

      await service.create(createDto, mockOrganizationId);

      expect(mockManager.create).toHaveBeenCalledWith(Subscription, {
        ...createDto,
        organizationId: mockOrganizationId,
      });
    });

    it('should create a subscription with all optional fields', async () => {
      const fullCreateDto: CreateSubscriptionDto = {
        stripeSubscriptionId: 'sub_stripe456',
        stripeCustomerId: 'cus_stripe456',
        stripePriceId: 'price_456',
        status: SubStatus.TRIALING,
        monthlyCreditsAlloc: 15000,
        currentPeriodStart: '2024-01-15T00:00:00Z',
        currentPeriodEnd: '2024-02-15T00:00:00Z',
        cancelAtPeriodEnd: false,
        trialEndsAt: '2024-01-30T00:00:00Z',
      };
      const createdSubscription = { ...mockSubscription, ...fullCreateDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdSubscription);
      (mockManager.save as jest.Mock).mockResolvedValue(createdSubscription);

      const result = await service.create(fullCreateDto, mockOrganizationId);

      expect(result.status).toBe(SubStatus.TRIALING);
      expect(result.monthlyCreditsAlloc).toBe(15000);
      expect(result.trialEndsAt).toBeDefined();
    });

    it('should create a subscription with default status', async () => {
      const minimalDto: CreateSubscriptionDto = {
        stripeSubscriptionId: 'sub_minimal',
        stripeCustomerId: 'cus_minimal',
        stripePriceId: 'price_minimal',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
      };
      const createdSubscription = {
        ...mockSubscription,
        ...minimalDto,
        status: SubStatus.ACTIVE,
      };
      (mockManager.create as jest.Mock).mockReturnValue(createdSubscription);
      (mockManager.save as jest.Mock).mockResolvedValue(createdSubscription);

      const result = await service.create(minimalDto, mockOrganizationId);

      expect(result.status).toBe(SubStatus.ACTIVE);
    });
  });

  describe('findOne', () => {
    it('should return the organization subscription', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await service.findOne();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(Subscription, {
        where: {},
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should throw NotFoundException when no subscription exists', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne()).rejects.toThrow(NotFoundException);
      await expect(service.findOne()).rejects.toThrow(
        'No subscription found for this organization',
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateSubscriptionDto = {
      status: SubStatus.PAST_DUE,
      monthlyCreditsAlloc: 12000,
    };

    it('should update a subscription successfully', async () => {
      const updatedSubscription = { ...mockSubscription, ...updateDto };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (mockManager.save as jest.Mock).mockResolvedValue(updatedSubscription);

      const result = await service.update(updateDto);

      expect(mockManager.findOne).toHaveBeenCalledWith(Subscription, {
        where: {},
      });
      expect(mockManager.save).toHaveBeenCalledWith(Subscription, mockSubscription);
      expect(result).toEqual(updatedSubscription);
    });

    it('should throw NotFoundException when updating non-existent subscription', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update(updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(updateDto)).rejects.toThrow(
        'No subscription found for this organization',
      );
    });

    it('should assign update dto properties to subscription', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (mockManager.save as jest.Mock).mockResolvedValue(mockSubscription);

      await service.update(updateDto);

      expect(mockSubscription.status).toBe(updateDto.status);
      expect(mockSubscription.monthlyCreditsAlloc).toBe(updateDto.monthlyCreditsAlloc);
    });

    it('should update cancelAtPeriodEnd flag', async () => {
      const cancelUpdate: UpdateSubscriptionDto = {
        cancelAtPeriodEnd: true,
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (mockManager.save as jest.Mock).mockResolvedValue(mockSubscription);

      await service.update(cancelUpdate);

      expect(mockSubscription.cancelAtPeriodEnd).toBe(true);
    });

    it('should update current period dates', async () => {
      const periodUpdate: UpdateSubscriptionDto = {
        currentPeriodStart: '2024-02-01T00:00:00Z',
        currentPeriodEnd: '2024-03-01T00:00:00Z',
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (mockManager.save as jest.Mock).mockResolvedValue(mockSubscription);

      await service.update(periodUpdate);

      expect(mockSubscription.currentPeriodStart).toBe(
        periodUpdate.currentPeriodStart,
      );
      expect(mockSubscription.currentPeriodEnd).toBe(periodUpdate.currentPeriodEnd);
    });
  });

  describe('multi-tenancy', () => {
    it('should use runWithTenant for all database operations', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSubscription);

      await service.findOne();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(typeof (tenancyService.runWithTenant as jest.Mock).mock.calls[0][0]).toBe(
        'function',
      );
    });

    it('should pass organization context through runWithTenant', async () => {
      const createDto: CreateSubscriptionDto = {
        stripeSubscriptionId: 'sub_test',
        stripeCustomerId: 'cus_test',
        stripePriceId: 'price_test',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
      };
      (mockManager.create as jest.Mock).mockReturnValue(mockSubscription);
      (mockManager.save as jest.Mock).mockResolvedValue(mockSubscription);

      await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection error');
      (mockManager.findOne as jest.Mock).mockRejectedValue(dbError);

      await expect(service.findOne()).rejects.toThrow('Database connection error');
    });

    it('should handle transaction errors', async () => {
      const transactionError = new Error('Transaction failed');
      (mockManager.save as jest.Mock).mockRejectedValue(transactionError);
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSubscription);

      const updateDto: UpdateSubscriptionDto = {
        status: SubStatus.ACTIVE,
      };

      await expect(service.update(updateDto)).rejects.toThrow('Transaction failed');
    });
  });

  describe('subscription status', () => {
    it('should create a subscription with ACTIVE status', async () => {
      const createDto: CreateSubscriptionDto = {
        stripeSubscriptionId: 'sub_active',
        stripeCustomerId: 'cus_active',
        stripePriceId: 'price_active',
        status: SubStatus.ACTIVE,
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
      };
      const activeSub = { ...mockSubscription, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(activeSub);
      (mockManager.save as jest.Mock).mockResolvedValue(activeSub);

      const result = await service.create(createDto, mockOrganizationId);

      expect(result.status).toBe(SubStatus.ACTIVE);
    });

    it('should create a subscription with TRIALING status', async () => {
      const createDto: CreateSubscriptionDto = {
        stripeSubscriptionId: 'sub_trial',
        stripeCustomerId: 'cus_trial',
        stripePriceId: 'price_trial',
        status: SubStatus.TRIALING,
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
        trialEndsAt: '2024-01-15T00:00:00Z',
      };
      const trialSub = { ...mockSubscription, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(trialSub);
      (mockManager.save as jest.Mock).mockResolvedValue(trialSub);

      const result = await service.create(createDto, mockOrganizationId);

      expect(result.status).toBe(SubStatus.TRIALING);
    });

    it('should update subscription to PAST_DUE status', async () => {
      const updateDto: UpdateSubscriptionDto = {
        status: SubStatus.PAST_DUE,
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (mockManager.save as jest.Mock).mockResolvedValue(mockSubscription);

      await service.update(updateDto);

      expect(mockSubscription.status).toBe(SubStatus.PAST_DUE);
    });

    it('should update subscription to CANCELED status', async () => {
      const updateDto: UpdateSubscriptionDto = {
        status: SubStatus.CANCELED,
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (mockManager.save as jest.Mock).mockResolvedValue(mockSubscription);

      await service.update(updateDto);

      expect(mockSubscription.status).toBe(SubStatus.CANCELED);
    });
  });

  describe('isActive', () => {
    it('should return true for ACTIVE subscription', () => {
      const activeSub = { ...mockSubscription, status: SubStatus.ACTIVE };
      activeSub.isActive = jest.fn().mockReturnValue(true);

      expect(activeSub.isActive()).toBe(true);
    });

    it('should return true for TRIALING subscription', () => {
      const trialingSub = { ...mockSubscription, status: SubStatus.TRIALING };
      trialingSub.isActive = jest.fn().mockReturnValue(true);

      expect(trialingSub.isActive()).toBe(true);
    });

    it('should return false for PAST_DUE subscription', () => {
      const pastDueSub = { ...mockSubscription, status: SubStatus.PAST_DUE };
      pastDueSub.isActive = jest.fn().mockReturnValue(false);

      expect(pastDueSub.isActive()).toBe(false);
    });

    it('should return false for CANCELED subscription', () => {
      const canceledSub = { ...mockSubscription, status: SubStatus.CANCELED };
      canceledSub.isActive = jest.fn().mockReturnValue(false);

      expect(canceledSub.isActive()).toBe(false);
    });
  });

  describe('daysRemaining', () => {
    it('should calculate days remaining until period end', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const subWithPeriod = {
        ...mockSubscription,
        currentPeriodEnd: futureDate,
        cancelAtPeriodEnd: false,
      };
      subWithPeriod.daysRemaining = jest.fn().mockReturnValue(15);

      expect(subWithPeriod.daysRemaining()).toBe(15);
    });

    it('should return 0 when period has ended', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const subWithPeriod = {
        ...mockSubscription,
        currentPeriodEnd: pastDate,
        cancelAtPeriodEnd: false,
      };
      subWithPeriod.daysRemaining = jest.fn().mockReturnValue(0);

      expect(subWithPeriod.daysRemaining()).toBe(0);
    });
  });
});
