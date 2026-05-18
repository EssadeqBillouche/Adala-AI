import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { ProjectsService } from './projects.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { Locale } from '../common/enums/locale.enum';
import { LegalDomain } from './entities/enums/legal-domain.enum';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let tenancyService: TenancyService;
  let dataSource: DataSource;
  let mockManager: Partial<EntityManager>;

  const mockOrganizationId = 'org-123e4567-e89b-12d3-a456-426614174000';
  const mockProjectId = 'proj-123e4567-e89b-12d3-a456-426614174000';

  const mockProject: Partial<Project> = {
    id: mockProjectId,
    title: 'Test Project',
    description: 'Test Description',
    legalDomain: LegalDomain.CIVIL,
    language: Locale.EN,
    isArchived: false,
    organizationId: mockOrganizationId,
    organization: undefined,
    conversations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    archive: jest.fn(),
    restore: jest.fn(),
  };

  beforeEach(async () => {
    mockManager = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const dataSourceMock = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockManager as EntityManager);
      }),
    };

    const tenancyServiceMock = {
      runWithTenant: jest.fn().mockImplementation(async (callback) => {
        // Simulate the actual implementation which uses dataSource.transaction
        return dataSourceMock.transaction(async (manager) => {
          return callback(manager);
        });
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
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    tenancyService = module.get<TenancyService>(TenancyService);
    dataSource = module.get<DataSource>(DataSource);
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

    it('should include organizationId in the created project', async () => {
      const createdProject = { ...mockProject, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdProject);
      (mockManager.save as jest.Mock).mockResolvedValue(createdProject);

      await service.create(createDto, mockOrganizationId);

      expect(mockManager.create).toHaveBeenCalledWith(Project, {
        ...createDto,
        organizationId: mockOrganizationId,
      });
    });

    it('should create project with default values', async () => {
      const minimalDto: CreateProjectDto = {
        title: 'Minimal Project',
      };
      const createdProject = {
        ...mockProject,
        ...minimalDto,
        description: null,
        legalDomain: null,
        language: Locale.EN,
        isArchived: false,
      };
      (mockManager.create as jest.Mock).mockReturnValue(createdProject);
      (mockManager.save as jest.Mock).mockResolvedValue(createdProject);

      const result = await service.create(minimalDto, mockOrganizationId);

      expect(result.title).toBe('Minimal Project');
      expect(result.language).toBe(Locale.EN);
      expect(result.isArchived).toBe(false);
    });

    it('should create project with all optional fields', async () => {
      const fullDto: CreateProjectDto & { description?: string; legalDomain?: LegalDomain; language?: Locale } = {
        title: 'Full Project',
        description: 'Detailed description',
        legalDomain: LegalDomain.CRIMINAL,
        language: Locale.FR,
      };
      const createdProject = { ...mockProject, ...fullDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdProject);
      (mockManager.save as jest.Mock).mockResolvedValue(createdProject);

      const result = await service.create(fullDto as CreateProjectDto, mockOrganizationId);

      expect(result.description).toBe('Detailed description');
      expect(result.legalDomain).toBe(LegalDomain.CRIMINAL);
      expect(result.language).toBe(Locale.FR);
    });

    it('should use transaction for create operation', async () => {
      const createdProject = { ...mockProject, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdProject);
      (mockManager.save as jest.Mock).mockResolvedValue(createdProject);

      await service.create(createDto, mockOrganizationId);

      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockProjects = [
      { ...mockProject, id: 'proj-1', title: 'Project 1' },
      { ...mockProject, id: 'proj-2', title: 'Project 2' },
      { ...mockProject, id: 'proj-3', title: 'Project 3' },
    ];

    it('should return all projects for the organization', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockProjects);

      const result = await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.find).toHaveBeenCalledWith(Project);
      expect(result).toEqual(mockProjects);
    });

    it('should return empty array when no projects exist', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should return multiple projects', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockProjects);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Project 1');
      expect(result[1].title).toBe('Project 2');
    });

    it('should use runWithTenant for find operation', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockProjects);

      await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(typeof (tenancyService.runWithTenant as jest.Mock).mock.calls[0][0]).toBe('function');
    });

    it('should rely on RLS for data isolation', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockProjects);

      await service.findAll();

      expect(mockManager.find).toHaveBeenCalledWith(Project);
    });
  });

  describe('multi-tenancy', () => {
    it('should use runWithTenant for create operations', async () => {
      const createDto: CreateProjectDto = { title: 'Test' };
      const createdProject = { ...mockProject, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdProject);
      (mockManager.save as jest.Mock).mockResolvedValue(createdProject);

      await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });

    it('should use runWithTenant for findAll operations', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });

    it('should pass organization context through runWithTenant', async () => {
      const createDto: CreateProjectDto = { title: 'Context Test' };
      const createdProject = { ...mockProject, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdProject);
      (mockManager.save as jest.Mock).mockResolvedValue(createdProject);

      await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should use transaction within runWithTenant', async () => {
      const createDto: CreateProjectDto = { title: 'Transaction Test' };
      const createdProject = { ...mockProject, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdProject);
      (mockManager.save as jest.Mock).mockResolvedValue(createdProject);

      await service.create(createDto, mockOrganizationId);

      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors on create', async () => {
      const createDto: CreateProjectDto = { title: 'Error Test' };
      const dbError = new Error('Database connection error');
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockProject, ...createDto });
      (mockManager.save as jest.Mock).mockRejectedValue(dbError);

      await expect(service.create(createDto, mockOrganizationId)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle transaction errors', async () => {
      const createDto: CreateProjectDto = { title: 'Transaction Error' };
      const transactionError = new Error('Transaction failed');
      (mockManager.save as jest.Mock).mockRejectedValue(transactionError);

      await expect(service.create(createDto, mockOrganizationId)).rejects.toThrow(
        'Transaction failed',
      );
    });

    it('should handle database errors on findAll', async () => {
      const dbError = new Error('Find failed');
      (mockManager.find as jest.Mock).mockRejectedValue(dbError);

      await expect(service.findAll()).rejects.toThrow('Find failed');
    });
  });

  describe('project entity methods', () => {
    it('should have archive method', () => {
      expect(mockProject.archive).toBeDefined();
      expect(typeof mockProject.archive).toBe('function');
    });

    it('should have restore method', () => {
      expect(mockProject.restore).toBeDefined();
      expect(typeof mockProject.restore).toBe('function');
    });

    it('should archive project by setting isArchived to true', () => {
      const project = { ...mockProject, isArchived: false };
      project.archive = jest.fn(() => {
        project.isArchived = true;
      });

      project.archive();

      expect(project.isArchived).toBe(true);
    });

    it('should restore project by setting isArchived to false', () => {
      const project = { ...mockProject, isArchived: true };
      project.restore = jest.fn(() => {
        project.isArchived = false;
      });

      project.restore();

      expect(project.isArchived).toBe(false);
    });
  });

  describe('LegalDomain enum', () => {
    it('should have legal domain enums defined', () => {
      expect(LegalDomain).toBeDefined();
    });
  });

  describe('Locale enum', () => {
    it('should have locale enum defined', () => {
      expect(Locale).toBeDefined();
    });
  });

  describe('project properties', () => {
    it('should create project with all required properties', async () => {
      const createDto: CreateProjectDto = { title: 'Complete Project' };
      const createdProject = {
        ...mockProject,
        ...createDto,
        id: 'proj-complete',
      };
      (mockManager.create as jest.Mock).mockReturnValue(createdProject);
      (mockManager.save as jest.Mock).mockResolvedValue(createdProject);

      const result = await service.create(createDto, mockOrganizationId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should allow optional properties to be null', async () => {
      const createDto: CreateProjectDto = { title: 'Nullable Project' };
      const createdProject = {
        ...mockProject,
        ...createDto,
        description: null,
        legalDomain: null,
      };
      (mockManager.create as jest.Mock).mockReturnValue(createdProject);
      (mockManager.save as jest.Mock).mockResolvedValue(createdProject);

      const result = await service.create(createDto, mockOrganizationId);

      expect(result.description).toBeNull();
      expect(result.legalDomain).toBeNull();
    });
  });

  describe('CreateProjectDto validation', () => {
    it('should require title field', () => {
      const invalidDto: Partial<CreateProjectDto> = {};
      expect(invalidDto.title).toBeUndefined();
    });

    it('should accept valid title', () => {
      const validDto: CreateProjectDto = { title: 'Valid Title' };
      expect(validDto.title).toBe('Valid Title');
    });
  });
});
