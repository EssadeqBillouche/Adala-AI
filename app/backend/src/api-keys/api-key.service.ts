import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { ApiKey } from './entities/api-key.entity';
import { TenancyService } from '../tenancy/tenancy.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(
    private tenancyService: TenancyService,
  ) {}

  generateApiKey(): { key: string; keyPrefix: string; keyHash: string } {
    const key = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = key.slice(0, 12);
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    return { key, keyPrefix, keyHash };
  }

  async create(createApiKeyDto: CreateApiKeyDto, organizationId: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const { key, keyPrefix, keyHash } = this.generateApiKey();

      const apiKey = manager.create(ApiKey, {
        ...createApiKeyDto,
        keyPrefix,
        keyHash,
        organizationId,
      });

      await manager.save(ApiKey, apiKey);

      return { apiKey, key };
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const skip = (page - 1) * limit;
      return manager.find(ApiKey, {
        select: ['id', 'name', 'keyPrefix', 'scopes', 'rateLimit', 'expiresAt', 'lastUsedAt', 'isRevoked', 'createdAt'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });
    });
  }

  async findOne(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const apiKey = await manager.findOne(ApiKey, {
        where: { id },
        select: ['id', 'name', 'keyPrefix', 'scopes', 'rateLimit', 'expiresAt', 'lastUsedAt', 'isRevoked', 'createdAt'],
      });
      if (!apiKey) {
        throw new NotFoundException(`ApiKey with ID ${id} not found`);
      }
      return apiKey;
    });
  }

  async update(id: string, updateApiKeyDto: UpdateApiKeyDto) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const apiKey = await manager.findOne(ApiKey, { where: { id } });
      if (!apiKey) {
        throw new NotFoundException(`ApiKey with ID ${id} not found`);
      }
      if (updateApiKeyDto.name !== undefined) apiKey.name = updateApiKeyDto.name;
      if (updateApiKeyDto.scopes !== undefined) apiKey.scopes = updateApiKeyDto.scopes;
      if (updateApiKeyDto.isRevoked !== undefined) apiKey.isRevoked = updateApiKeyDto.isRevoked;
      if (updateApiKeyDto.expiresAt !== undefined) apiKey.expiresAt = updateApiKeyDto.expiresAt as any;
      return manager.save(ApiKey, apiKey);
    });
  }

  async revoke(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const apiKey = await manager.findOne(ApiKey, { where: { id } });
      if (!apiKey) {
        throw new NotFoundException(`ApiKey with ID ${id} not found`);
      }
      apiKey.revoke();
      return manager.save(ApiKey, apiKey);
    });
  }

  async remove(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const apiKey = await manager.findOne(ApiKey, { where: { id } });
      if (!apiKey) {
        throw new NotFoundException(`ApiKey with ID ${id} not found`);
      }
      await manager.remove(ApiKey, apiKey);
      return { id, deleted: true };
    });
  }

  async validateKey(key: string): Promise<ApiKey | null> {
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    return this.tenancyService.runBypassingTenant(async (manager) => {
      const apiKey = await manager.findOne(ApiKey, {
        where: { keyHash },
        relations: ['organization'],
      });
      if (!apiKey || !apiKey.isValid()) {
        return null;
      }
      apiKey.lastUsedAt = new Date();
      await manager.save(ApiKey, apiKey);
      return apiKey;
    });
  }
}
