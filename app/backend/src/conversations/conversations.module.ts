import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { MessageCitation } from './entities/message-citation.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { TenancyModule } from '../tenancy/tenancy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, MessageCitation]),
    TenancyModule,
  ],
  controllers: [ConversationsController, MessagesController],
  providers: [ConversationsService, MessagesService],
  exports: [ConversationsService, MessagesService],
})
export class ConversationsModule {}
