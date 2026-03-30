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

  async findAll(conversationId?: string) {
    return this.tenancyService.runWithTenant(async (manager) => {
      const where: Record<string, unknown> = {};
      if (conversationId) {
        where.conversationId = conversationId;
      }
      return manager.find(Message, { where, relations: ['citations'] });
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
      Object.assign(message, updateMessageDto);
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
