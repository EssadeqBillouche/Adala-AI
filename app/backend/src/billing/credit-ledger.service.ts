import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';

import { CreateCreditLedgerDto } from './dto/create-credit-ledger.dto';
import { CreditLedger } from './entities/credit-ledger.entity';
import { TenancyService } from '../tenancy/tenancy.service';

@Injectable()
export class CreditLedgerService {
  private readonly logger = new Logger(CreditLedgerService.name);

  constructor(
    private tenancyService: TenancyService,
  ) {}

  async create(createCreditLedgerDto: CreateCreditLedgerDto, organizationId: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const existing = await manager.findOne(CreditLedger, {
        where: { idempotencyKey: createCreditLedgerDto.idempotencyKey },
      });
      if (existing) {
        throw new ConflictException('Transaction with this idempotency key already exists');
      }

      const result = await manager
        .createQueryBuilder(CreditLedger, 'ledger')
        .select('SUM(amount)', 'balance')
        .getRawOne();
      const currentBalance = parseInt(result.balance) || 0;

      const creditLedger = manager.create(CreditLedger, {
        ...createCreditLedgerDto,
        organizationId,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance + createCreditLedgerDto.amount,
      });
      return manager.save(CreditLedger, creditLedger);
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const skip = (page - 1) * limit;
      return manager.find(CreditLedger, { order: { createdAt: 'DESC' }, skip, take: limit });
    });
  }

  async findOne(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const creditLedger = await manager.findOne(CreditLedger, { where: { id } });
      if (!creditLedger) {
        throw new NotFoundException(`CreditLedger with ID ${id} not found`);
      }
      return creditLedger;
    });
  }

  async getBalance(): Promise<number> {
    return this.tenancyService.runWithTenant(async (manager) => {
      const result = await manager
        .createQueryBuilder(CreditLedger, 'ledger')
        .select('SUM(amount)', 'balance')
        .getRawOne();
      return parseInt(result.balance) || 0;
    });
  }
}
