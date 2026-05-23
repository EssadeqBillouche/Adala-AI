import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { LegalSourcesService } from './legal-sources.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { LegalSource } from './entities/legal-source.entity';
import { CreateLegalSourceDto } from './dto/create-legal-source.dto';
import { UpdateLegalSourceDto } from './dto/update-legal-source.dto';
import { SourceType } from './entities/enums/source-type.enum';
import { LegalDomain } from './entities/enums/legal-domain.enum';
import { Locale } from '../common/enums/locale.enum';
import { Jurisdiction } from './entities/enums/jurisdiction.enum';
import { EmbeddingStatus } from './entities/enums/embedding-status.enum';

describe('LegalSourcesService', () => {
  let service: LegalSourcesService;
  let tenancyService: TenancyService;
  let dataSource: DataSource;
  let mockManager: Partial<EntityManager>;

  const mockOrganizationId = 'org-123e4567-e89b-12d3-a456-426614174000';
  const mockLegalSourceId = 'ls-123e4567-e89b-12d3-a456-426614174000';

  const mockLegalSource: Partial<LegalSource> = {
    id: mockLegalSourceId,
    title: 'Dahir on Commercial Contracts',
    fileName: 'dahir_2024.pdf',
    fileType: 'application/pdf',
    sourceType: SourceType.DAHIR,
    articleRef: 'Article 42',
    dahirNumber: '1-24-05',
    bulletinNumber: 'BO 1234',
    language: Locale.EN,
    legalDomain: LegalDomain.COMMERCIAL,
    jurisdiction: Jurisdiction.NATIONAL,
    s3Url: 'https://bucket.s3.amazonaws.com/doc.pdf',
    embeddingStatus: EmbeddingStatus.DONE,
    chunkCount: 150,
    isActive: true,
    organizationId: mockOrganizationId,
    citations: [],
    isAbrogated: jest.fn(),
    isEmbedded: jest.fn(),
  };

  beforeEach(async () => {
    mockManager = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const tenancyServiceMock = {
      runWithTenant: jest.fn((callback) => callback(mockManager as EntityManager)),
    };

    const dataSourceMock = {
      transaction: jest.fn((callback) => callback(mockManager as EntityManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalSourcesService,
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

    service = module.get<LegalSourcesService>(LegalSourcesService);
    tenancyService = module.get<TenancyService>(TenancyService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateLegalSourceDto = {
      title: 'New Legal Source',
      sourceType: SourceType.DAHIR,
      language: Locale.FR,
      legalDomain: LegalDomain.CIVIL,
    };

    it('should create a legal source successfully', async () => {
      const createdLegalSource = { ...mockLegalSource, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdLegalSource);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLegalSource);

      const result = await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.create).toHaveBeenCalledWith(LegalSource, {
        ...createDto,
        organizationId: mockOrganizationId,
      });
      expect(mockManager.save).toHaveBeenCalledWith(LegalSource, createdLegalSource);
      expect(result).toEqual(createdLegalSource);
    });

    it('should include organizationId in the created legal source', async () => {
      const createdLegalSource = { ...mockLegalSource, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdLegalSource);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLegalSource);

      await service.create(createDto, mockOrganizationId);

      expect(mockManager.create).toHaveBeenCalledWith(LegalSource, {
        ...createDto,
        organizationId: mockOrganizationId,
      });
    });

    it('should create a legal source with all optional fields', async () => {
      const fullCreateDto: CreateLegalSourceDto = {
        title: 'Complete Legal Source',
        fileName: 'complete.pdf',
        fileType: 'application/pdf',
        sourceType: SourceType.JURISPRUDENCE,
        articleRef: 'Article 100',
        dahirNumber: '1-23-10',
        bulletinNumber: 'BO 5678',
        language: Locale.AR,
        legalDomain: LegalDomain.PENAL,
        effectiveDate: '2024-01-01',
        jurisdiction: Jurisdiction.REGIONAL,
        s3Url: 'https://bucket.s3.amazonaws.com/complete.pdf',
      };
      const createdLegalSource = { ...mockLegalSource, ...fullCreateDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdLegalSource);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLegalSource);

      const result = await service.create(fullCreateDto, mockOrganizationId);

      expect(result.fileName).toBe('complete.pdf');
      expect(result.dahirNumber).toBe('1-23-10');
      expect(result.legalDomain).toBe(LegalDomain.PENAL);
      expect(result.jurisdiction).toBe(Jurisdiction.REGIONAL);
    });

    it('should create a legal source with minimal fields', async () => {
      const minimalDto: CreateLegalSourceDto = {
        title: 'Minimal Source',
        sourceType: SourceType.CODE,
      };
      const createdLegalSource = { ...mockLegalSource, ...minimalDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdLegalSource);
      (mockManager.save as jest.Mock).mockResolvedValue(createdLegalSource);

      const result = await service.create(minimalDto, mockOrganizationId);

      expect(result.title).toBe('Minimal Source');
      expect(result.sourceType).toBe(SourceType.CODE);
    });
  });

  describe('findAll', () => {
    const mockLegalSources = [mockLegalSource];

    it('should return all legal sources for the organization', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockLegalSources);

      const result = await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.find).toHaveBeenCalledWith(LegalSource, {
        relations: ['citations'],
        skip: 0,
        take: 10,
      });
      expect(result).toEqual(mockLegalSources);
    });

    it('should include citations relation', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockLegalSources);

      await service.findAll();

      expect(mockManager.find).toHaveBeenCalledWith(LegalSource, {
        relations: ['citations'],
        skip: 0,
        take: 10,
      });
    });

    it('should return empty array when no legal sources exist', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should return multiple legal sources', async () => {
      const multipleSources = [
        { ...mockLegalSource, id: 'ls-1', title: 'Source 1' },
        { ...mockLegalSource, id: 'ls-2', title: 'Source 2' },
        { ...mockLegalSource, id: 'ls-3', title: 'Source 3' },
      ];
      (mockManager.find as jest.Mock).mockResolvedValue(multipleSources);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Source 1');
    });
  });

  describe('findOne', () => {
    it('should return a legal source by id', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockLegalSource);

      const result = await service.findOne(mockLegalSourceId);

      expect(mockManager.findOne).toHaveBeenCalledWith(LegalSource, {
        where: { id: mockLegalSourceId },
        relations: ['citations'],
      });
      expect(result).toEqual(mockLegalSource);
    });

    it('should throw NotFoundException when legal source not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockLegalSourceId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockLegalSourceId)).rejects.toThrow(
        `LegalSource with ID ${mockLegalSourceId} not found`,
      );
    });

    it('should include citations relation when finding one', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockLegalSource);

      await service.findOne(mockLegalSourceId);

      expect(mockManager.findOne).toHaveBeenCalledWith(LegalSource, {
        where: { id: mockLegalSourceId },
        relations: ['citations'],
      });
    });

    it('should return legal source with citations', async () => {
      const legalSourceWithCitations = {
        ...mockLegalSource,
        citations: [
          { id: 'cit-1', rank: 1, similarityScore: 0.95, excerpt: 'Relevant text' },
          { id: 'cit-2', rank: 2, similarityScore: 0.88, excerpt: 'Another excerpt' },
        ],
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(legalSourceWithCitations);

      const result = await service.findOne(mockLegalSourceId);

      expect(result.citations).toHaveLength(2);
      expect(result.citations[0].rank).toBe(1);
    });
  });

  describe('update', () => {
    const updateDto: UpdateLegalSourceDto = {
      title: 'Updated Title',
      embeddingStatus: EmbeddingStatus.PROCESSING,
      isActive: false,
    };

    it('should update a legal source successfully', async () => {
      const updatedLegalSource = { ...mockLegalSource, ...updateDto };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockLegalSource);
      (mockManager.save as jest.Mock).mockResolvedValue(updatedLegalSource);

      const result = await service.update(mockLegalSourceId, updateDto);

      expect(mockManager.findOne).toHaveBeenCalledWith(LegalSource, {
        where: { id: mockLegalSourceId },
      });
      expect(mockManager.save).toHaveBeenCalledWith(LegalSource, mockLegalSource);
      expect(result).toEqual(updatedLegalSource);
    });

    it('should throw NotFoundException when updating non-existent legal source', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update(mockLegalSourceId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(mockLegalSourceId, updateDto)).rejects.toThrow(
        `LegalSource with ID ${mockLegalSourceId} not found`,
      );
    });

    it('should assign update dto properties to legal source', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockLegalSource);
      (mockManager.save as jest.Mock).mockResolvedValue(mockLegalSource);

      await service.update(mockLegalSourceId, updateDto);

      expect(mockLegalSource.title).toBe(updateDto.title);
      expect(mockLegalSource.embeddingStatus).toBe(updateDto.embeddingStatus);
      expect(mockLegalSource.isActive).toBe(updateDto.isActive);
    });

    it('should update only provided fields', async () => {
      const mockLs = { ...mockLegalSource, title: 'Original Title' };
      const partialUpdate: UpdateLegalSourceDto = {
        chunkCount: 200,
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockLs);
      (mockManager.save as jest.Mock).mockResolvedValue(mockLs);

      await service.update(mockLegalSourceId, partialUpdate);

      expect(mockLs.chunkCount).toBe(200);
      expect(mockLs.title).toBe('Original Title'); // unchanged
    });

    it('should mark legal source as abrogated (isActive: false)', async () => {
      const abrogateUpdate: UpdateLegalSourceDto = {
        isActive: false,
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockLegalSource);
      (mockManager.save as jest.Mock).mockResolvedValue(mockLegalSource);

      await service.update(mockLegalSourceId, abrogateUpdate);

      expect(mockLegalSource.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove a legal source successfully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockLegalSource);
      (mockManager.remove as jest.Mock).mockResolvedValue(mockLegalSource);

      const result = await service.remove(mockLegalSourceId);

      expect(mockManager.findOne).toHaveBeenCalledWith(LegalSource, {
        where: { id: mockLegalSourceId },
      });
      expect(mockManager.remove).toHaveBeenCalledWith(LegalSource, mockLegalSource);
      expect(result).toEqual({ id: mockLegalSourceId, deleted: true });
    });

    it('should throw NotFoundException when removing non-existent legal source', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(mockLegalSourceId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(mockLegalSourceId)).rejects.toThrow(
        `LegalSource with ID ${mockLegalSourceId} not found`,
      );
    });
  });

  describe('multi-tenancy', () => {
    it('should use runWithTenant for all database operations', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockLegalSource);

      await service.findOne(mockLegalSourceId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(typeof (tenancyService.runWithTenant as jest.Mock).mock.calls[0][0]).toBe(
        'function',
      );
    });

    it('should pass organization context through runWithTenant', async () => {
      const createDto: CreateLegalSourceDto = {
        title: 'Test',
        sourceType: SourceType.DAHIR,
      };
      (mockManager.create as jest.Mock).mockReturnValue(mockLegalSource);
      (mockManager.save as jest.Mock).mockResolvedValue(mockLegalSource);

      await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection error');
      (mockManager.findOne as jest.Mock).mockRejectedValue(dbError);

      await expect(service.findOne(mockLegalSourceId)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle transaction errors', async () => {
      const transactionError = new Error('Transaction failed');
      (mockManager.save as jest.Mock).mockRejectedValue(transactionError);
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockLegalSource);

      await expect(service.update(mockLegalSourceId, { title: 'Test' })).rejects.toThrow(
        'Transaction failed',
      );
    });

    it('should handle remove errors', async () => {
      const removeError = new Error('Remove failed');
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockLegalSource);
      (mockManager.remove as jest.Mock).mockRejectedValue(removeError);

      await expect(service.remove(mockLegalSourceId)).rejects.toThrow('Remove failed');
    });
  });

  describe('source types', () => {
    it('should create a DAHIR source', async () => {
      const dahirDto: CreateLegalSourceDto = {
        title: 'Dahir 2024',
        sourceType: SourceType.DAHIR,
        dahirNumber: '1-24-01',
      };
      const dahirSource = { ...mockLegalSource, ...dahirDto };
      (mockManager.create as jest.Mock).mockReturnValue(dahirSource);
      (mockManager.save as jest.Mock).mockResolvedValue(dahirSource);

      const result = await service.create(dahirDto, mockOrganizationId);

      expect(result.sourceType).toBe(SourceType.DAHIR);
      expect(result.dahirNumber).toBe('1-24-01');
    });

    it('should create a CODE source', async () => {
      const codeDto: CreateLegalSourceDto = {
        title: 'Commercial Code',
        sourceType: SourceType.CODE,
        articleRef: 'Article 1-100',
      };
      const codeSource = { ...mockLegalSource, ...codeDto };
      (mockManager.create as jest.Mock).mockReturnValue(codeSource);
      (mockManager.save as jest.Mock).mockResolvedValue(codeSource);

      const result = await service.create(codeDto, mockOrganizationId);

      expect(result.sourceType).toBe(SourceType.CODE);
    });

    it('should create a JURISPRUDENCE source', async () => {
      const jurisprudenceDto: CreateLegalSourceDto = {
        title: 'Court Decision 2024',
        sourceType: SourceType.JURISPRUDENCE,
      };
      const jurisprudenceSource = { ...mockLegalSource, ...jurisprudenceDto };
      (mockManager.create as jest.Mock).mockReturnValue(jurisprudenceSource);
      (mockManager.save as jest.Mock).mockResolvedValue(jurisprudenceSource);

      const result = await service.create(jurisprudenceDto, mockOrganizationId);

      expect(result.sourceType).toBe(SourceType.JURISPRUDENCE);
    });

    it('should create a DOCTRINE source', async () => {
      const doctrineDto: CreateLegalSourceDto = {
        title: 'Legal Analysis',
        sourceType: SourceType.DOCTRINE,
      };
      const doctrineSource = { ...mockLegalSource, ...doctrineDto };
      (mockManager.create as jest.Mock).mockReturnValue(doctrineSource);
      (mockManager.save as jest.Mock).mockResolvedValue(doctrineSource);

      const result = await service.create(doctrineDto, mockOrganizationId);

      expect(result.sourceType).toBe(SourceType.DOCTRINE);
    });

    it('should create a CIRCULAR source', async () => {
      const circularDto: CreateLegalSourceDto = {
        title: 'Ministerial Circular',
        sourceType: SourceType.CIRCULAR,
        bulletinNumber: 'BO 9999',
      };
      const circularSource = { ...mockLegalSource, ...circularDto };
      (mockManager.create as jest.Mock).mockReturnValue(circularSource);
      (mockManager.save as jest.Mock).mockResolvedValue(circularSource);

      const result = await service.create(circularDto, mockOrganizationId);

      expect(result.sourceType).toBe(SourceType.CIRCULAR);
    });
  });

  describe('embedding status', () => {
    it('should create legal source with PENDING embedding status', async () => {
      const createDto: CreateLegalSourceDto = {
        title: 'New Source',
        sourceType: SourceType.DAHIR,
      };
      const pendingSource = {
        ...mockLegalSource,
        ...createDto,
        embeddingStatus: EmbeddingStatus.PENDING,
      };
      (mockManager.create as jest.Mock).mockReturnValue(pendingSource);
      (mockManager.save as jest.Mock).mockResolvedValue(pendingSource);

      const result = await service.create(createDto, mockOrganizationId);

      expect(result.embeddingStatus).toBe(EmbeddingStatus.PENDING);
    });

    it('should update embedding status to DONE', async () => {
      const updateDto: UpdateLegalSourceDto = {
        embeddingStatus: EmbeddingStatus.DONE,
        chunkCount: 250,
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockLegalSource);
      (mockManager.save as jest.Mock).mockResolvedValue(mockLegalSource);

      await service.update(mockLegalSourceId, updateDto);

      expect(mockLegalSource.embeddingStatus).toBe(EmbeddingStatus.DONE);
      expect(mockLegalSource.chunkCount).toBe(250);
    });

    it('should check if legal source is embedded', async () => {
      const embeddedSource = { ...mockLegalSource, embeddingStatus: EmbeddingStatus.DONE };
      embeddedSource.isEmbedded = jest.fn().mockReturnValue(true);
      (mockManager.findOne as jest.Mock).mockResolvedValue(embeddedSource);

      const result = await service.findOne(mockLegalSourceId);

      expect(result.isEmbedded()).toBe(true);
    });

    it('should check if legal source is not embedded', async () => {
      const pendingSource = {
        ...mockLegalSource,
        embeddingStatus: EmbeddingStatus.PENDING,
      };
      pendingSource.isEmbedded = jest.fn().mockReturnValue(false);
      (mockManager.findOne as jest.Mock).mockResolvedValue(pendingSource);

      const result = await service.findOne(mockLegalSourceId);

      expect(result.isEmbedded()).toBe(false);
    });
  });

  describe('legal domains', () => {
    it('should create a CIVIL legal source', async () => {
      const civilDto: CreateLegalSourceDto = {
        title: 'Civil Code',
        sourceType: SourceType.CODE,
        legalDomain: LegalDomain.CIVIL,
      };
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockLegalSource, ...civilDto });
      (mockManager.save as jest.Mock).mockResolvedValue({ ...mockLegalSource, ...civilDto });

      const result = await service.create(civilDto, mockOrganizationId);

      expect(result.legalDomain).toBe(LegalDomain.CIVIL);
    });

    it('should create a PENAL legal source', async () => {
      const penalDto: CreateLegalSourceDto = {
        title: 'Penal Code',
        sourceType: SourceType.CODE,
        legalDomain: LegalDomain.PENAL,
      };
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockLegalSource, ...penalDto });
      (mockManager.save as jest.Mock).mockResolvedValue({ ...mockLegalSource, ...penalDto });

      const result = await service.create(penalDto, mockOrganizationId);

      expect(result.legalDomain).toBe(LegalDomain.PENAL);
    });

    it('should create a COMMERCIAL legal source', async () => {
      const commercialDto: CreateLegalSourceDto = {
        title: 'Commercial Law',
        sourceType: SourceType.DAHIR,
        legalDomain: LegalDomain.COMMERCIAL,
      };
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockLegalSource, ...commercialDto });
      (mockManager.save as jest.Mock).mockResolvedValue({ ...mockLegalSource, ...commercialDto });

      const result = await service.create(commercialDto, mockOrganizationId);

      expect(result.legalDomain).toBe(LegalDomain.COMMERCIAL);
    });

    it('should create a FAMILY legal source', async () => {
      const familyDto: CreateLegalSourceDto = {
        title: 'Family Code',
        sourceType: SourceType.CODE,
        legalDomain: LegalDomain.FAMILY,
      };
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockLegalSource, ...familyDto });
      (mockManager.save as jest.Mock).mockResolvedValue({ ...mockLegalSource, ...familyDto });

      const result = await service.create(familyDto, mockOrganizationId);

      expect(result.legalDomain).toBe(LegalDomain.FAMILY);
    });

    it('should create an ADMINISTRATIVE legal source', async () => {
      const adminDto: CreateLegalSourceDto = {
        title: 'Administrative Law',
        sourceType: SourceType.DOCTRINE,
        legalDomain: LegalDomain.ADMINISTRATIVE,
      };
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockLegalSource, ...adminDto });
      (mockManager.save as jest.Mock).mockResolvedValue({ ...mockLegalSource, ...adminDto });

      const result = await service.create(adminDto, mockOrganizationId);

      expect(result.legalDomain).toBe(LegalDomain.ADMINISTRATIVE);
    });

    it('should create a LABOR legal source', async () => {
      const laborDto: CreateLegalSourceDto = {
        title: 'Labor Code',
        sourceType: SourceType.CODE,
        legalDomain: LegalDomain.LABOR,
      };
      (mockManager.create as jest.Mock).mockReturnValue({ ...mockLegalSource, ...laborDto });
      (mockManager.save as jest.Mock).mockResolvedValue({ ...mockLegalSource, ...laborDto });

      const result = await service.create(laborDto, mockOrganizationId);

      expect(result.legalDomain).toBe(LegalDomain.LABOR);
    });
  });
});
