import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CreditLedgerService } from './credit-ledger.service';
import { CreateCreditLedgerDto } from './dto/create-credit-ledger.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('credit-ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credit-ledger')
export class CreditLedgerController {
  constructor(private readonly creditLedgerService: CreditLedgerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new credit ledger entry' })
  @ApiResponse({ status: 201, description: 'Credit ledger entry created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Duplicate transaction (idempotency key exists)' })
  create(@Body() createCreditLedgerDto: CreateCreditLedgerDto, @CurrentUser() user: any) {
    return this.creditLedgerService.create(createCreditLedgerDto, user.orgId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all credit ledger entries for the current organization' })
  @ApiResponse({ status: 200, description: 'List of credit ledger entries' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {
    return this.creditLedgerService.findAll();
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get current credit balance' })
  @ApiResponse({ status: 200, description: 'Current balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getBalance() {
    return this.creditLedgerService.getBalance();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific credit ledger entry by ID' })
  @ApiParam({ name: 'id', description: 'Credit Ledger UUID' })
  @ApiResponse({ status: 200, description: 'Credit ledger entry found' })
  @ApiResponse({ status: 404, description: 'Credit ledger entry not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.creditLedgerService.findOne(id);
  }
}
