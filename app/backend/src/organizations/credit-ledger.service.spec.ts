import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CreditLedgerService } from './credit-ledger.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { CreditLedger } from './entities/credit-ledger.entity';
import { CreateCreditLedgerDto } from './dto/create-credit-ledger.dto';
import { TransactionType } from './entities/enums/transaction-type.enum';

describe('CreditLedgerService', () => {
  let service: CreditLedgerService;
  let tenancyService: TenancyService;
  let dataSource: DataSource;
  let mockManager: Partial<EntityManager>;

  const mockOrganizationId = 'org-123e4567-e89b-12d3-a456-426614174000';
  const mockLedgerId = 'ledger-123e4567-e89b-12d3-a456-426614174000';
  const mockIdempotencyKey = 'txn-unique-key-123';

  const mockCreditLedger: Partial<CreditLedger> = {
    id: mockLedgerId,
    type: TransactionType.TOPUP,
    amount: 5000,
    balanceBefore: 1000,
    balanceAfter: 6000,
    reason: 'Monthly subscription',
    idempotencyKey: mockIdempotencyKey,
    organizationId: mockOrganizationId,
    isDebit: jest.fn(),
  };

  beforeEach(async () => {
    mockManager = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
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
        CreditLedgerService,
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

    service = module.get<CreditLedgerService>(CreditLedgerService);
    tenancyService = module.get<TenancyService>(TenancyService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateCreditLedgerDto = {
      type: TransactionType.TOPUP,
      amount: 5000,
      balanceBefore: 1000,
      balanceAfter: 6000,
      reason: 'Monthly top-up',
      idempotencyKey: mockIdempotencyKey,
    };

    it('should create a credit ledger entry successfully', async () => {
      const createdLedger = { ...mockCreditLedger, ...createDto };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue(createdLedger);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLedger);

      const result = await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(CreditLedger, {
        where: { idempotencyKey: mockIdempotencyKey },
      });
      expect(mockManager.create).toHaveBeenCalledWith(CreditLedger, {
        ...createDto,
        organizationId: mockOrganizationId,
      });
      expect(result).toEqual(createdLedger);
    });

    it('should throw ConflictException for duplicate idempotency key', async () => {
      const existingLedger = { ...mockCreditLedger };
      (mockManager.findOne as jest.Mock).mockResolvedValue(existingLedger);

      await expect(service.create(createDto, mockOrganizationId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto, mockOrganizationId)).rejects.toThrow(
        'Transaction with this idempotency key already exists',
      );
    });

    it('should include organizationId in the created ledger', async () => {
      const createdLedger = { ...mockCreditLedger, ...createDto };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue(createdLedger);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLedger);

      await service.create(createDto, mockOrganizationId);

      expect(mockManager.create).toHaveBeenCalledWith(CreditLedger, {
        ...createDto,
        organizationId: mockOrganizationId,
      });
    });

    it('should create a SPEND transaction', async () => {
      const spendDto: CreateCreditLedgerDto = {
        type: TransactionType.SPEND,
        amount: -500,
        balanceBefore: 6000,
        balanceAfter: 5500,
        reason: 'API usage',
        idempotencyKey: 'txn-spend-123',
      };
      const createdLedger = { ...mockCreditLedger, ...spendDto };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue(createdLedger);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLedger);

      const result = await service.create(spendDto, mockOrganizationId);

      expect(result.type).toBe(TransactionType.SPEND);
      expect(result.amount).toBe(-500);
    });

    it('should create a REFUND transaction', async () => {
      const refundDto: CreateCreditLedgerDto = {
        type: TransactionType.REFUND,
        amount: 200,
        balanceBefore: 5500,
        balanceAfter: 5700,
        reason: 'Refund for overcharge',
        idempotencyKey: 'txn-refund-123',
      };
      const createdLedger = { ...mockCreditLedger, ...refundDto };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue(createdLedger);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLedger);

      const result = await service.create(refundDto, mockOrganizationId);

      expect(result.type).toBe(TransactionType.REFUND);
    });
  });

  describe('findAll', () => {
    const mockLedgers = [mockCreditLedger];

    it('should return all credit ledger entries for the organization', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockLedgers);

      const result = await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.find).toHaveBeenCalledWith(CreditLedger, {
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockLedgers);
    });

    it('should order by createdAt DESC', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockLedgers);

      await service.findAll();

      expect(mockManager.find).toHaveBeenCalledWith(CreditLedger, {
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no ledger entries exist', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should return multiple ledger entries', async () => {
      const multipleLedgers = [
        { ...mockCreditLedger, id: 'ledger-1', amount: 5000 },
        { ...mockCreditLedger, id: 'ledger-2', amount: -500 },
        { ...mockCreditLedger, id: 'ledger-3', amount: 1000 },
      ];
      (mockManager.find as jest.Mock).mockResolvedValue(multipleLedgers);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
    });
  });

  describe('findOne', () => {
    it('should return a credit ledger entry by id', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockCreditLedger);

      const result = await service.findOne(mockLedgerId);

      expect(mockManager.findOne).toHaveBeenCalledWith(CreditLedger, {
        where: { id: mockLedgerId },
      });
      expect(result).toEqual(mockCreditLedger);
    });

    it('should throw NotFoundException when ledger not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockLedgerId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockLedgerId)).rejects.toThrow(
        `CreditLedger with ID ${mockLedgerId} not found`,
      );
    });
  });

  describe('getBalance', () => {
    it('should return the sum of all ledger amounts', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: '6000' }),
      };
      (mockManager.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await service.getBalance();

      expect(result).toBe(6000);
      expect(mockManager.createQueryBuilder).toHaveBeenCalledWith(CreditLedger, 'ledger');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('SUM(amount)', 'balance');
    });

    it('should return 0 when no ledger entries exist', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: null }),
      };
      (mockManager.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await service.getBalance();

      expect(result).toBe(0);
    });

    it('should return 0 when balance is undefined', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({}),
      };
      (mockManager.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await service.getBalance();

      expect(result).toBe(0);
    });

    it('should parse balance string to integer', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ balance: '12500' }),
      };
      (mockManager.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await service.getBalance();

      expect(result).toBe(12500);
    });
  });

  describe('multi-tenancy', () => {
    it('should use runWithTenant for all database operations', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockCreditLedger);

      await service.findOne(mockLedgerId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(typeof (tenancyService.runWithTenant as jest.Mock).mock.calls[0][0]).toBe(
        'function',
      );
    });

    it('should pass organization context through runWithTenant', async () => {
      const createDto: CreateCreditLedgerDto = {
        type: TransactionType.TOPUP,
        amount: 1000,
        balanceBefore: 0,
        balanceAfter: 1000,
        idempotencyKey: 'txn-test',
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue(mockCreditLedger);
      (mockManager.save as jest.Mock).mockResolvedValue(mockCreditLedger);

      await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection error');
      (mockManager.findOne as jest.Mock).mockRejectedValue(dbError);

      await expect(service.findOne(mockLedgerId)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle transaction errors', async () => {
      const transactionError = new Error('Transaction failed');
      (mockManager.save as jest.Mock).mockRejectedValue(transactionError);
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue(mockCreditLedger);

      const createDto: CreateCreditLedgerDto = {
        type: TransactionType.TOPUP,
        amount: 1000,
        balanceBefore: 0,
        balanceAfter: 1000,
        idempotencyKey: 'txn-test',
      };

      await expect(service.create(createDto, mockOrganizationId)).rejects.toThrow(
        'Transaction failed',
      );
    });

    it('should handle createQueryBuilder errors', async () => {
      const queryError = new Error('Query failed');
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockRejectedValue(queryError),
      };
      (mockManager.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      await expect(service.getBalance()).rejects.toThrow('Query failed');
    });
  });

  describe('transaction types', () => {
    it('should handle TOPUP transaction', async () => {
      const topupDto: CreateCreditLedgerDto = {
        type: TransactionType.TOPUP,
        amount: 10000,
        balanceBefore: 0,
        balanceAfter: 10000,
        idempotencyKey: 'txn-topup',
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockCreditLedger, ...topupDto });
      (mockManager.save as jest.Mock).mockResolvedValue({ ...mockCreditLedger, ...topupDto });

      const result = await service.create(topupDto, mockOrganizationId);

      expect(result.type).toBe(TransactionType.TOPUP);
      expect(result.amount).toBe(10000);
    });

    it('should handle SPEND transaction', async () => {
      const spendDto: CreateCreditLedgerDto = {
        type: TransactionType.SPEND,
        amount: -1000,
        balanceBefore: 10000,
        balanceAfter: 9000,
        idempotencyKey: 'txn-spend',
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockCreditLedger, ...spendDto });
      (mockManager.save as jest.Mock).mockResolvedValue({ ...mockCreditLedger, ...spendDto });

      const result = await service.create(spendDto, mockOrganizationId);

      expect(result.type).toBe(TransactionType.SPEND);
      expect(result.amount).toBe(-1000);
    });

    it('should handle REFUND transaction', async () => {
      const refundDto: CreateCreditLedgerDto = {
        type: TransactionType.REFUND,
        amount: 500,
        balanceBefore: 9000,
        balanceAfter: 9500,
        idempotencyKey: 'txn-refund',
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockCreditLedger, ...refundDto });
      (mockManager.save as jest.Mock).mockResolvedValue({ ...mockCreditLedger, ...refundDto });

      const result = await service.create(refundDto, mockOrganizationId);

      expect(result.type).toBe(TransactionType.REFUND);
    });

    it('should handle EXPIRE transaction', async () => {
      const expireDto: CreateCreditLedgerDto = {
        type: TransactionType.EXPIRE,
        amount: -500,
        balanceBefore: 9500,
        balanceAfter: 9000,
        reason: 'Credits expired',
        idempotencyKey: 'txn-expire',
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockCreditLedger, ...expireDto });
      (mockManager.save as jest.Mock).mockResolvedValue({ ...mockCreditLedger, ...expireDto });

      const result = await service.create(expireDto, mockOrganizationId);

      expect(result.type).toBe(TransactionType.EXPIRE);
    });

    it('should handle BONUS transaction', async () => {
      const bonusDto: CreateCreditLedgerDto = {
        type: TransactionType.BONUS,
        amount: 1000,
        balanceBefore: 9000,
        balanceAfter: 10000,
        reason: 'Referral bonus',
        idempotencyKey: 'txn-bonus',
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockCreditLedger, ...bonusDto });
      (mockManager.save as jest.Mock).mockResolvedValue({ ...mockCreditLedger, ...bonusDto });

      const result = await service.create(bonusDto, mockOrganizationId);

      expect(result.type).toBe(TransactionType.BONUS);
    });
  });

  describe('isDebit', () => {
    it('should return true for SPEND transactions', () => {
      const spendLedger = { ...mockCreditLedger, type: TransactionType.SPEND };
      spendLedger.isDebit = jest.fn().mockReturnValue(true);

      expect(spendLedger.isDebit()).toBe(true);
    });

    it('should return true for EXPIRE transactions', () => {
      const expireLedger = { ...mockCreditLedger, type: TransactionType.EXPIRE };
      expireLedger.isDebit = jest.fn().mockReturnValue(true);

      expect(expireLedger.isDebit()).toBe(true);
    });

    it('should return false for TOPUP transactions', () => {
      const topupLedger = { ...mockCreditLedger, type: TransactionType.TOPUP };
      topupLedger.isDebit = jest.fn().mockReturnValue(false);

      expect(topupLedger.isDebit()).toBe(false);
    });

    it('should return false for REFUND transactions', () => {
      const refundLedger = { ...mockCreditLedger, type: TransactionType.REFUND };
      refundLedger.isDebit = jest.fn().mockReturnValue(false);

      expect(refundLedger.isDebit()).toBe(false);
    });
  });
});
