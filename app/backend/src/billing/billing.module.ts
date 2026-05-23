import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { CreditLedger } from './entities/credit-ledger.entity';
import { SubscriptionService } from './subscription.service';
import { CreditLedgerService } from './credit-ledger.service';
import { SubscriptionController } from './subscription.controller';
import { CreditLedgerController } from './credit-ledger.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, CreditLedger])],
  providers: [SubscriptionService, CreditLedgerService],
  controllers: [SubscriptionController, CreditLedgerController],
  exports: [SubscriptionService, CreditLedgerService],
})
export class BillingModule {}
