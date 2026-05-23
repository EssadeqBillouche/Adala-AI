import { Injectable, Logger } from '@nestjs/common';

import { AuditLog } from './entities/audit-log.entity';
import { ActorType } from './entities/enums/actor-type.enum';
import { TenancyService } from '../tenancy/tenancy.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    private tenancyService: TenancyService,
  ) {}

  async log(
    actorType: ActorType,
    action: string,
    resourceType: string,
    resourceId: string,
    diff?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const auditLog = manager.create(AuditLog, {
        actorType,
        action,
        resourceType,
        resourceId,
        diff,
        ipAddress,
        userAgent,
      });
      return manager.save(AuditLog, auditLog);
    });
  }

  async findAll(page: number = 1, limit: number = 100) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const skip = (page - 1) * limit;
      return manager.find(AuditLog, {
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });
    });
  }

  async findByResource(resourceType: string, resourceId: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      return manager.find(AuditLog, {
        where: { resourceType, resourceId },
        order: { createdAt: 'DESC' },
      });
    });
  }
}
