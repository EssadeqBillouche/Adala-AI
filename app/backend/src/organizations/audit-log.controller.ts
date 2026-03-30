import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  findAll(@Query('limit') limit?: string) {
    return this.auditLogService.findAll(limit ? parseInt(limit, 10) : 100);
  }
}
