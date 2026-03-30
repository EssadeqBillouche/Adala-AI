import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { Organization } from './entities/organization.entity';
import { CreditLedger } from './entities/credit-ledger.entity';
import { Subscription } from './entities/subscription.entity';
import { ApiKey } from './entities/api-key.entity';
import { AuditLog } from './entities/audit-log.entity';
import { CreditLedgerService } from './credit-ledger.service';
import { SubscriptionService } from './subscription.service';
import { ApiKeyService } from './api-key.service';
import { AuditLogService } from './audit-log.service';
import { CreditLedgerController } from './credit-ledger.controller';
import { SubscriptionController } from './subscription.controller';
import { ApiKeyController } from './api-key.controller';
import { AuditLogController } from './audit-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, CreditLedger, Subscription, ApiKey, AuditLog])],
  providers: [OrganizationsService, CreditLedgerService, SubscriptionService, ApiKeyService, AuditLogService],
  controllers: [CreditLedgerController, SubscriptionController, ApiKeyController, AuditLogController],
  exports: [OrganizationsService, CreditLedgerService, SubscriptionService, ApiKeyService, AuditLogService],
})
export class OrganizationsModule {}
