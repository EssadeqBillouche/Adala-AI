import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation } from './entities/conversation.entity';
import { TenancyService } from '../tenancy/tenancy.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private tenancyService: TenancyService,
    private dataSource: DataSource,
  ) {}

  async create(createConversationDto: CreateConversationDto, organizationId: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const conversation = manager.create(Conversation, {
        ...createConversationDto,
        organizationId,
      });
      return manager.save(Conversation, conversation);
    });
  }

  async findAll(projectId?: string, page: number = 1, limit: number = 10) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const where: Record<string, unknown> = {};
      if (projectId) {
        where.projectId = projectId;
      }
      const skip = (page - 1) * limit;
      return manager.find(Conversation, { where, relations: ['messages'], skip, take: limit });
    });
  }

  async findOne(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const conversation = await manager.findOne(Conversation, {
        where: { id },
        relations: ['messages'],
      });
      if (!conversation) {
        throw new NotFoundException(`Conversation with ID ${id} not found`);
      }
      return conversation;
    });
  }

  async update(id: string, updateConversationDto: UpdateConversationDto) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const conversation = await manager.findOne(Conversation, { where: { id } });
      if (!conversation) {
        throw new NotFoundException(`Conversation with ID ${id} not found`);
      }
      if (updateConversationDto.title !== undefined) conversation.title = updateConversationDto.title;
      if (updateConversationDto.summary !== undefined) conversation.summary = updateConversationDto.summary;
      if (updateConversationDto.status !== undefined) conversation.status = updateConversationDto.status;
      if (updateConversationDto.language !== undefined) conversation.language = updateConversationDto.language;
      return manager.save(Conversation, conversation);
    });
  }

  async archive(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const conversation = await manager.findOne(Conversation, { where: { id } });
      if (!conversation) {
        throw new NotFoundException(`Conversation with ID ${id} not found`);
      }
      conversation.archive();
      return manager.save(Conversation, conversation);
    });
  }

  async restore(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const conversation = await manager.findOne(Conversation, { where: { id } });
      if (!conversation) {
        throw new NotFoundException(`Conversation with ID ${id} not found`);
      }
      conversation.restore();
      return manager.save(Conversation, conversation);
    });
  }

  async remove(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const conversation = await manager.findOne(Conversation, { where: { id } });
      if (!conversation) {
        throw new NotFoundException(`Conversation with ID ${id} not found`);
      }
      await manager.remove(Conversation, conversation);
      return { id, deleted: true };
    });
  }
}
