import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { ProjectsService } from './projects.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let tenancyService: TenancyService;
  let mockManager: Partial<EntityManager>;

  const mockOrganizationId = 'org-123e4567-e89b-12d3-a456-426614174000';
  const mockProjectId = 'proj-123e4567-e89b-12d3-a456-426614174000';

  const mockProject: Partial<Project> = {
    id: mockProjectId,
    title: 'Test Project',
    description: 'Test Description',
    isArchived: false,
    organizationId: mockOrganizationId,
  };

  beforeEach(async () => {
    mockManager = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const tenancyServiceMock = {
      runWithTenant: jest.fn().mockImplementation(async (callback) => {
        return callback(mockManager as EntityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: TenancyService,
          useValue: tenancyServiceMock,
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    tenancyService = module.get<TenancyService>(TenancyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateProjectDto = {
      title: 'New Project',
    };

    it('should create a project successfully', async () => {
      const createdProject = { ...mockProject, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdProject);
      (mockManager.save as jest.Mock).mockResolvedValue(createdProject);

      const result = await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.create).toHaveBeenCalledWith(Project, {
        ...createDto,
        organizationId: mockOrganizationId,
      });
      expect(mockManager.save).toHaveBeenCalledWith(Project, createdProject);
      expect(result).toEqual(createdProject);
    });
  });

  describe('findAll', () => {
    it('should return all projects for the organization', async () => {
      const mockProjects = [mockProject];
      (mockManager.find as jest.Mock).mockResolvedValue(mockProjects);

      const result = await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.find).toHaveBeenCalledWith(Project);
      expect(result).toEqual(mockProjects);
    });
  });
});
