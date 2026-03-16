import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';
import { TenancyService } from '../tenancy/tenancy.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private tenancyService: TenancyService,
    private dataSource: DataSource,
  ) {}

  async create(createProjectDto: CreateProjectDto, organizationId: string) {
    // When creating, we must physically set the orgId as postgres won't infer the insert schema automatically
    return this.tenancyService.runWithTenant(async (manager) => {
      const project = manager.create(Project, {
        ...createProjectDto,
        organizationId,
      });
      return manager.save(Project, project);
    });
  }

  async findAll() {
    // The beauty of RLS: we do NOT include "where: { organizationId }" here.
    // The database itself acts as the firewall based on the CLS transaction.
    return this.tenancyService.runWithTenant(async (manager) => {
      return manager.find(Project); // Will purely return THIS tenant's projects.
    });
  }
}
