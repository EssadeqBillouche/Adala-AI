import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { CreditLedgerService } from './credit-ledger.service';
import { CreateCreditLedgerDto } from './dto/create-credit-ledger.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('credit-ledger')
export class CreditLedgerController {
  constructor(private readonly creditLedgerService: CreditLedgerService) {}

  @Post()
  create(@Body() createCreditLedgerDto: CreateCreditLedgerDto, @CurrentUser() user: any) {
    return this.creditLedgerService.create(createCreditLedgerDto, user.orgId);
  }

  @Get()
  findAll() {
    return this.creditLedgerService.findAll();
  }

  @Get('balance')
  getBalance() {
    return this.creditLedgerService.getBalance();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditLedgerService.findOne(id);
  }
}
