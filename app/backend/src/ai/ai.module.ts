import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiEngineModule } from '../ai-engine/ai-engine.module';

@Module({
  imports: [AiEngineModule],
  controllers: [AiController],
})
export class AiModule {}
