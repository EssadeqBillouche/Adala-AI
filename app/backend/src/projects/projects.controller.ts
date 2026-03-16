import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() user: any) {
    // We pass the payload and let the service handle the context implicitly!
    return this.projectsService.create(createProjectDto, user.orgId);
  }

  @Get()
  findAll() {
    // Notice how we don't even pass orgId into findAll(). RLS and TenancyService handle it entirely under the hood.
    return this.projectsService.findAll();
  }
}
