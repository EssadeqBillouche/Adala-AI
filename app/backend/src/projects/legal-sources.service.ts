import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateLegalSourceDto } from './dto/create-legal-source.dto';
import { UpdateLegalSourceDto } from './dto/update-legal-source.dto';
import { LegalSource } from './entities/legal-source.entity';
import { TenancyService } from '../tenancy/tenancy.service';

@Injectable()
export class LegalSourcesService {
  private readonly logger = new Logger(LegalSourcesService.name);

  constructor(
    private tenancyService: TenancyService,
    private dataSource: DataSource,
  ) {}

  async create(createLegalSourceDto: CreateLegalSourceDto, organizationId: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const legalSource = manager.create(LegalSource, {
        ...createLegalSourceDto,
        organizationId,
      });
      return manager.save(LegalSource, legalSource);
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const skip = (page - 1) * limit;
      return manager.find(LegalSource, { relations: ['citations'], skip, take: limit });
    });
  }

  async findOne(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const legalSource = await manager.findOne(LegalSource, {
        where: { id },
        relations: ['citations'],
      });
      if (!legalSource) {
        throw new NotFoundException(`LegalSource with ID ${id} not found`);
      }
      return legalSource;
    });
  }

  async update(id: string, updateLegalSourceDto: UpdateLegalSourceDto) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const legalSource = await manager.findOne(LegalSource, { where: { id } });
      if (!legalSource) {
        throw new NotFoundException(`LegalSource with ID ${id} not found`);
      }
      Object.assign(legalSource, updateLegalSourceDto);
      return manager.save(LegalSource, legalSource);
    });
  }

  async remove(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const legalSource = await manager.findOne(LegalSource, { where: { id } });
      if (!legalSource) {
        throw new NotFoundException(`LegalSource with ID ${id} not found`);
      }
      await manager.remove(LegalSource, legalSource);
      return { id, deleted: true };
    });
  }
}
