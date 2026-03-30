import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ConversationsService } from './conversations.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { Conversation } from './entities/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConvStatus } from './entities/enums/conv-status.enum';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let tenancyService: TenancyService;
  let dataSource: DataSource;
  let mockManager: Partial<EntityManager>;

  const mockOrganizationId = 'org-123e4567-e89b-12d3-a456-426614174000';
  const mockConversationId = 'conv-123e4567-e89b-12d3-a456-426614174000';

  const mockConversation: Partial<Conversation> = {
    id: mockConversationId,
    title: 'Test Conversation',
    summary: 'Test Summary',
    status: ConvStatus.ACTIVE,
    organizationId: mockOrganizationId,
    projectId: 'proj-123',
    totalTokensUsed: 0,
    totalCreditsUsed: 0,
    vectorThreadIds: [],
    archive: jest.fn(),
    restore: jest.fn(),
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
        ConversationsService,
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

    service = module.get<ConversationsService>(ConversationsService);
    tenancyService = module.get<TenancyService>(TenancyService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateConversationDto = {
      title: 'New Conversation',
      summary: 'Test summary',
      projectId: 'proj-123',
    };

    it('should create a conversation successfully', async () => {
      const createdConversation = { ...mockConversation, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdConversation);
      (mockManager.save as jest.Mock).mockResolvedValue(createdConversation);

      const result = await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.create).toHaveBeenCalledWith(Conversation, {
        ...createDto,
        organizationId: mockOrganizationId,
      });
      expect(mockManager.save).toHaveBeenCalledWith(Conversation, createdConversation);
      expect(result).toEqual(createdConversation);
    });

    it('should include organizationId in the created conversation', async () => {
      const createdConversation = { ...mockConversation, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdConversation);
      (mockManager.save as jest.Mock).mockResolvedValue(createdConversation);

      await service.create(createDto, mockOrganizationId);

      expect(mockManager.create).toHaveBeenCalledWith(Conversation, {
        ...createDto,
        organizationId: mockOrganizationId,
      });
    });
  });

  describe('findAll', () => {
    const mockConversations = [mockConversation];

    it('should return all conversations for the organization', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockConversations);

      const result = await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.find).toHaveBeenCalledWith(Conversation, {
        where: {},
        relations: ['messages'],
      });
      expect(result).toEqual(mockConversations);
    });

    it('should filter by projectId when provided', async () => {
      const projectId = 'proj-123';
      (mockManager.find as jest.Mock).mockResolvedValue(mockConversations);

      await service.findAll(projectId);

      expect(mockManager.find).toHaveBeenCalledWith(Conversation, {
        where: { projectId },
        relations: ['messages'],
      });
    });

    it('should include messages relation', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockConversations);

      await service.findAll();

      expect(mockManager.find).toHaveBeenCalledWith(Conversation, {
        where: {},
        relations: ['messages'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a conversation by id', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockConversation);

      const result = await service.findOne(mockConversationId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Conversation, {
        where: { id: mockConversationId },
        relations: ['messages'],
      });
      expect(result).toEqual(mockConversation);
    });

    it('should throw NotFoundException when conversation not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockConversationId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockConversationId)).rejects.toThrow(
        `Conversation with ID ${mockConversationId} not found`,
      );
    });

    it('should include messages relation when finding one', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockConversation);

      await service.findOne(mockConversationId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Conversation, {
        where: { id: mockConversationId },
        relations: ['messages'],
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateConversationDto = {
      title: 'Updated Title',
      status: ConvStatus.ARCHIVED,
    };

    it('should update a conversation successfully', async () => {
      const updatedConversation = { ...mockConversation, ...updateDto };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockConversation);
      (mockManager.save as jest.Mock).mockResolvedValue(updatedConversation);

      const result = await service.update(mockConversationId, updateDto);

      expect(mockManager.findOne).toHaveBeenCalledWith(Conversation, {
        where: { id: mockConversationId },
      });
      expect(mockManager.save).toHaveBeenCalledWith(Conversation, mockConversation);
      expect(result).toEqual(updatedConversation);
    });

    it('should throw NotFoundException when updating non-existent conversation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update(mockConversationId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(mockConversationId, updateDto)).rejects.toThrow(
        `Conversation with ID ${mockConversationId} not found`,
      );
    });

    it('should assign update dto properties to conversation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockConversation);
      (mockManager.save as jest.Mock).mockResolvedValue(mockConversation);

      await service.update(mockConversationId, updateDto);

      expect(mockConversation.title).toBe(updateDto.title);
      expect(mockConversation.status).toBe(updateDto.status);
    });
  });

  describe('archive', () => {
    it('should archive a conversation successfully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockConversation);
      (mockManager.save as jest.Mock).mockResolvedValue(mockConversation);

      const result = await service.archive(mockConversationId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Conversation, {
        where: { id: mockConversationId },
      });
      expect(mockConversation.archive).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalledWith(Conversation, mockConversation);
      expect(result).toEqual(mockConversation);
    });

    it('should throw NotFoundException when archiving non-existent conversation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.archive(mockConversationId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.archive(mockConversationId)).rejects.toThrow(
        `Conversation with ID ${mockConversationId} not found`,
      );
    });
  });

  describe('restore', () => {
    it('should restore an archived conversation successfully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockConversation);
      (mockManager.save as jest.Mock).mockResolvedValue(mockConversation);

      const result = await service.restore(mockConversationId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Conversation, {
        where: { id: mockConversationId },
      });
      expect(mockConversation.restore).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalledWith(Conversation, mockConversation);
      expect(result).toEqual(mockConversation);
    });

    it('should throw NotFoundException when restoring non-existent conversation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.restore(mockConversationId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.restore(mockConversationId)).rejects.toThrow(
        `Conversation with ID ${mockConversationId} not found`,
      );
    });
  });

  describe('remove', () => {
    it('should remove a conversation successfully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockConversation);
      (mockManager.remove as jest.Mock).mockResolvedValue(mockConversation);

      const result = await service.remove(mockConversationId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Conversation, {
        where: { id: mockConversationId },
      });
      expect(mockManager.remove).toHaveBeenCalledWith(Conversation, mockConversation);
      expect(result).toEqual({ id: mockConversationId, deleted: true });
    });

    it('should throw NotFoundException when removing non-existent conversation', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(mockConversationId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(mockConversationId)).rejects.toThrow(
        `Conversation with ID ${mockConversationId} not found`,
      );
    });
  });

  describe('multi-tenancy', () => {
    it('should use runWithTenant for all database operations', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockConversation);
      (mockManager.save as jest.Mock).mockResolvedValue(mockConversation);

      await service.findOne(mockConversationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(typeof (tenancyService.runWithTenant as jest.Mock).mock.calls[0][0]).toBe(
        'function',
      );
    });

    it('should pass organization context through runWithTenant', async () => {
      const createDto: CreateConversationDto = {
        title: 'Test',
        projectId: 'proj-123',
      };
      (mockManager.create as jest.Mock).mockReturnValue(mockConversation);
      (mockManager.save as jest.Mock).mockResolvedValue(mockConversation);

      await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection error');
      (mockManager.findOne as jest.Mock).mockRejectedValue(dbError);

      await expect(service.findOne(mockConversationId)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle transaction errors', async () => {
      const transactionError = new Error('Transaction failed');
      (mockManager.save as jest.Mock).mockRejectedValue(transactionError);
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockConversation);

      await expect(service.update(mockConversationId, { title: 'Test' })).rejects.toThrow(
        'Transaction failed',
      );
    });
  });
});
