import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class TenancyService {
  constructor(
    private dataSource: DataSource,
    private cls: ClsService,
  ) {}

  /**
   * Runs the provided TypeORM operation forcefully constrained by Row-Level Security
   */
  async runWithTenant<T>(operation: (manager: EntityManager) => Promise<T>): Promise<T> {
    const tenantId = this.cls.get('tenantId');
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is missing required for secured data access');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. SET LOCAL applies the variable strictly to the current transaction
      // 2. We use ::text to securely map UUIDs to the RLS policy evaluation
      await manager.query(`SET LOCAL "app.current_tenant_id" = $1`, [tenantId]);
      
      // 3. Now run the safe DB operation seamlessly
      return operation(manager);
    });
  }

  /**
   * Elevated operation bypassing Row-Level Security context (Use with extreme caution internally)
   */
  async runBypassingTenant<T>(operation: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
       await manager.query(`SET LOCAL "app.current_tenant_id" = ''`);
       return operation(manager);
    });
  }
}
