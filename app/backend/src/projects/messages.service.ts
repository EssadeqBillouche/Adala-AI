import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';
import { TenancyService } from '../tenancy/tenancy.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private tenancyService: TenancyService,
    private dataSource: DataSource,
  ) {}

  async create(createMessageDto: CreateMessageDto, organizationId: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const message = manager.create(Message, {
        ...createMessageDto,
      });
      return manager.save(Message, message);
    });
  }

  async findAll(conversationId?: string, page: number = 1, limit: number = 10) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const where: Record<string, unknown> = {};
      if (conversationId) {
        where.conversationId = conversationId;
      }
      const skip = (page - 1) * limit;
      return manager.find(Message, { where, relations: ['citations'], skip, take: limit });
    });
  }

  async findOne(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const message = await manager.findOne(Message, {
        where: { id },
        relations: ['citations'],
      });
      if (!message) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }
      return message;
    });
  }

  async update(id: string, updateMessageDto: UpdateMessageDto) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const message = await manager.findOne(Message, { where: { id } });
      if (!message) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }
      if (updateMessageDto.role !== undefined) message.role = updateMessageDto.role;
      if (updateMessageDto.content !== undefined) message.content = updateMessageDto.content;
      if (updateMessageDto.tokensIn !== undefined) message.tokensIn = updateMessageDto.tokensIn;
      if (updateMessageDto.tokensOut !== undefined) message.tokensOut = updateMessageDto.tokensOut;
      if (updateMessageDto.latencyMs !== undefined) message.latencyMs = updateMessageDto.latencyMs;
      if (updateMessageDto.ragScore !== undefined) message.ragScore = updateMessageDto.ragScore;
      if (updateMessageDto.errorCode !== undefined) message.errorCode = updateMessageDto.errorCode;
      if (updateMessageDto.metadata !== undefined) message.metadata = updateMessageDto.metadata;
      return manager.save(Message, message);
    });
  }

  async remove(id: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const message = await manager.findOne(Message, { where: { id } });
      if (!message) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }
      await manager.remove(Message, message);
      return { id, deleted: true };
    });
  }
}
