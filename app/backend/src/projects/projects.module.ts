import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { LegalSource } from './entities/legal-source.entity';
import { MessageCitation } from './entities/message-citation.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { LegalSourcesService } from './legal-sources.service';
import { LegalSourcesController } from './legal-sources.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Conversation, Message, LegalSource, MessageCitation])],
  controllers: [ProjectsController, ConversationsController, MessagesController, LegalSourcesController],
  providers: [ProjectsService, ConversationsService, MessagesService, LegalSourcesService],
})
export class ProjectsModule {}
