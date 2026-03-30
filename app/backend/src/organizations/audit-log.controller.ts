import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs for the current organization' })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query('limit') limit?: string) {
    return this.auditLogService.findAll(limit ? parseInt(limit, 10) : 100);
  }
}
