import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { MessagesService } from './messages.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageRole } from './entities/enums/message-role.enum';

describe('MessagesService', () => {
  let service: MessagesService;
  let tenancyService: TenancyService;
  let dataSource: DataSource;
  let mockManager: Partial<EntityManager>;

  const mockOrganizationId = 'org-123e4567-e89b-12d3-a456-426614174000';
  const mockMessageId = 'msg-123e4567-e89b-12d3-a456-426614174000';
  const mockConversationId = 'conv-123e4567-e89b-12d3-a456-426614174000';

  const mockMessage: Partial<Message> = {
    id: mockMessageId,
    role: MessageRole.USER,
    content: 'Test message content',
    tokensIn: 100,
    tokensOut: 200,
    latencyMs: 1500,
    ragScore: 0.85,
    citationCount: 0,
    conversationId: mockConversationId,
    citations: [],
    isFromAssistant: jest.fn(),
    hasCitations: jest.fn(),
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
        MessagesService,
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

    service = module.get<MessagesService>(MessagesService);
    tenancyService = module.get<TenancyService>(TenancyService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateMessageDto = {
      role: MessageRole.USER,
      content: 'New message',
      conversationId: mockConversationId,
      tokensIn: 50,
      tokensOut: 100,
    };

    it('should create a message successfully', async () => {
      const createdMessage = { ...mockMessage, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdMessage);
      (mockManager.save as jest.Mock).mockResolvedValue(createdMessage);

      const result = await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.create).toHaveBeenCalledWith(Message, {
        ...createDto,
      });
      expect(mockManager.save).toHaveBeenCalledWith(Message, createdMessage);
      expect(result).toEqual(createdMessage);
    });

    it('should create a message with all optional fields', async () => {
      const fullCreateDto: CreateMessageDto = {
        role: MessageRole.ASSISTANT,
        content: 'Assistant response',
        conversationId: mockConversationId,
        tokensIn: 150,
        tokensOut: 300,
        latencyMs: 2000,
        ragScore: 0.92,
        metadata: { model: 'gpt-4', temperature: 0.7 },
      };
      const createdMessage = { ...mockMessage, ...fullCreateDto };
      (mockManager.create as jest.Mock).mockReturnValue(createdMessage);
      (mockManager.save as jest.Mock).mockResolvedValue(createdMessage);

      const result = await service.create(fullCreateDto, mockOrganizationId);

      expect(result.ragScore).toBe(0.92);
      expect(result.latencyMs).toBe(2000);
      expect(result.metadata).toEqual({ model: 'gpt-4', temperature: 0.7 });
    });

    it('should create a message without optional fields', async () => {
      const minimalDto: CreateMessageDto = {
        role: MessageRole.USER,
        content: 'Simple message',
        conversationId: mockConversationId,
      };
      const createdMessage = { ...mockMessage, ...minimalDto, tokensIn: undefined, tokensOut: undefined };
      (mockManager.create as jest.Mock).mockReturnValue(createdMessage);
      (mockManager.save as jest.Mock).mockResolvedValue(createdMessage);

      const result = await service.create(minimalDto, mockOrganizationId);

      expect(result.tokensIn).toBeUndefined();
      expect(result.tokensOut).toBeUndefined();
    });
  });

  describe('findAll', () => {
    const mockMessages = [mockMessage];

    it('should return all messages for the organization', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockMessages);

      const result = await service.findAll();

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(mockManager.find).toHaveBeenCalledWith(Message, {
        where: {},
        relations: ['citations'],
        skip: 0,
        take: 10,
      });
      expect(result).toEqual(mockMessages);
    });

    it('should filter by conversationId when provided', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockMessages);

      await service.findAll(mockConversationId);

      expect(mockManager.find).toHaveBeenCalledWith(Message, {
        where: { conversationId: mockConversationId },
        relations: ['citations'],
        skip: 0,
        take: 10,
      });
    });

    it('should include citations relation', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue(mockMessages);

      await service.findAll();

      expect(mockManager.find).toHaveBeenCalledWith(Message, {
        where: {},
        relations: ['citations'],
        skip: 0,
        take: 10,
      });
    });

    it('should return empty array when no messages exist', async () => {
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a message by id', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockMessage);

      const result = await service.findOne(mockMessageId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Message, {
        where: { id: mockMessageId },
        relations: ['citations'],
      });
      expect(result).toEqual(mockMessage);
    });

    it('should throw NotFoundException when message not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockMessageId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockMessageId)).rejects.toThrow(
        `Message with ID ${mockMessageId} not found`,
      );
    });

    it('should include citations relation when finding one', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockMessage);

      await service.findOne(mockMessageId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Message, {
        where: { id: mockMessageId },
        relations: ['citations'],
      });
    });

    it('should return message with citations', async () => {
      const messageWithCitations = {
        ...mockMessage,
        citations: [
          { id: 'cit-1', rank: 1, similarityScore: 0.95 },
          { id: 'cit-2', rank: 2, similarityScore: 0.88 },
        ],
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(messageWithCitations);

      const result = await service.findOne(mockMessageId);

      expect(result.citations).toHaveLength(2);
      expect(result.citations[0].rank).toBe(1);
    });
  });

  describe('update', () => {
    const updateDto: UpdateMessageDto = {
      content: 'Updated content',
      tokensOut: 350,
      ragScore: 0.90,
    };

    it('should update a message successfully', async () => {
      const updatedMessage = { ...mockMessage, ...updateDto };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockMessage);
      (mockManager.save as jest.Mock).mockResolvedValue(updatedMessage);

      const result = await service.update(mockMessageId, updateDto);

      expect(mockManager.findOne).toHaveBeenCalledWith(Message, {
        where: { id: mockMessageId },
      });
      expect(mockManager.save).toHaveBeenCalledWith(Message, mockMessage);
      expect(result).toEqual(updatedMessage);
    });

    it('should throw NotFoundException when updating non-existent message', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update(mockMessageId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(mockMessageId, updateDto)).rejects.toThrow(
        `Message with ID ${mockMessageId} not found`,
      );
    });

    it('should assign update dto properties to message', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockMessage);
      (mockManager.save as jest.Mock).mockResolvedValue(mockMessage);

      await service.update(mockMessageId, updateDto);

      expect(mockMessage.content).toBe(updateDto.content);
      expect(mockMessage.tokensOut).toBe(updateDto.tokensOut);
      expect(mockMessage.ragScore).toBe(updateDto.ragScore);
    });

    it('should update only provided fields', async () => {
      const mockMsg = { ...mockMessage, content: 'Test message content' };
      const partialUpdate: UpdateMessageDto = {
        latencyMs: 1800,
      };
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockMsg);
      (mockManager.save as jest.Mock).mockResolvedValue(mockMsg);

      await service.update(mockMessageId, partialUpdate);

      expect(mockMsg.latencyMs).toBe(1800);
      expect(mockMsg.content).toBe('Test message content'); // unchanged
    });
  });

  describe('remove', () => {
    it('should remove a message successfully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockMessage);
      (mockManager.remove as jest.Mock).mockResolvedValue(mockMessage);

      const result = await service.remove(mockMessageId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Message, {
        where: { id: mockMessageId },
      });
      expect(mockManager.remove).toHaveBeenCalledWith(Message, mockMessage);
      expect(result).toEqual({ id: mockMessageId, deleted: true });
    });

    it('should throw NotFoundException when removing non-existent message', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(mockMessageId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(mockMessageId)).rejects.toThrow(
        `Message with ID ${mockMessageId} not found`,
      );
    });
  });

  describe('multi-tenancy', () => {
    it('should use runWithTenant for all database operations', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockMessage);

      await service.findOne(mockMessageId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
      expect(typeof (tenancyService.runWithTenant as jest.Mock).mock.calls[0][0]).toBe(
        'function',
      );
    });

    it('should pass organization context through runWithTenant', async () => {
      const createDto: CreateMessageDto = {
        role: MessageRole.USER,
        content: 'Test',
        conversationId: mockConversationId,
      };
      (mockManager.create as jest.Mock).mockReturnValue(mockMessage);
      (mockManager.save as jest.Mock).mockResolvedValue(mockMessage);

      await service.create(createDto, mockOrganizationId);

      expect(tenancyService.runWithTenant).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection error');
      (mockManager.findOne as jest.Mock).mockRejectedValue(dbError);

      await expect(service.findOne(mockMessageId)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle transaction errors', async () => {
      const transactionError = new Error('Transaction failed');
      (mockManager.save as jest.Mock).mockRejectedValue(transactionError);
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockMessage);

      await expect(service.update(mockMessageId, { content: 'Test' })).rejects.toThrow(
        'Transaction failed',
      );
    });

    it('should handle remove errors', async () => {
      const removeError = new Error('Remove failed');
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockMessage);
      (mockManager.remove as jest.Mock).mockRejectedValue(removeError);

      await expect(service.remove(mockMessageId)).rejects.toThrow('Remove failed');
    });
  });

  describe('message roles', () => {
    it('should create a USER message', async () => {
      const userMessageDto: CreateMessageDto = {
        role: MessageRole.USER,
        content: 'User question',
        conversationId: mockConversationId,
      };
      const userMessage = { ...mockMessage, ...userMessageDto };
      (mockManager.create as jest.Mock).mockReturnValue(userMessage);
      (mockManager.save as jest.Mock).mockResolvedValue(userMessage);

      const result = await service.create(userMessageDto, mockOrganizationId);

      expect(result.role).toBe(MessageRole.USER);
    });

    it('should create an ASSISTANT message', async () => {
      const assistantMessageDto: CreateMessageDto = {
        role: MessageRole.ASSISTANT,
        content: 'Assistant response',
        conversationId: mockConversationId,
        tokensOut: 250,
      };
      const assistantMessage = { ...mockMessage, ...assistantMessageDto };
      (mockManager.create as jest.Mock).mockReturnValue(assistantMessage);
      (mockManager.save as jest.Mock).mockResolvedValue(assistantMessage);

      const result = await service.create(assistantMessageDto, mockOrganizationId);

      expect(result.role).toBe(MessageRole.ASSISTANT);
      expect(result.tokensOut).toBe(250);
    });

    it('should create a SYSTEM message', async () => {
      const systemMessageDto: CreateMessageDto = {
        role: MessageRole.SYSTEM,
        content: 'System instruction',
        conversationId: mockConversationId,
      };
      const systemMessage = { ...mockMessage, ...systemMessageDto };
      (mockManager.create as jest.Mock).mockReturnValue(systemMessage);
      (mockManager.save as jest.Mock).mockResolvedValue(systemMessage);

      const result = await service.create(systemMessageDto, mockOrganizationId);

      expect(result.role).toBe(MessageRole.SYSTEM);
    });
  });
});
