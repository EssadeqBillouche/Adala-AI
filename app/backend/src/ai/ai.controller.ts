import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AskStreamDto } from './dto/ask-stream.dto';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiEngineService: AiEngineService) {}

  @Post('ask-stream')
  @ApiOperation({ summary: 'Ask the AI engine with SSE streaming' })
  async askStream(
    @Body() body: AskStreamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const tenantId = user.orgId;

    this.logger.log(`Streaming request for tenant: ${tenantId}`);

    // Set SSE headers — must be set before any data is written
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    // Disable Express's default chunked encoding buffering
    res.flushHeaders();

    try {
      // Stream each SSE event as soon as it arrives — no buffering
      for await (const event of this.aiEngineService.streamAsk({
        question: body.question,
        tenant_id: tenantId,
        n_results: 5,
      })) {
        const chunk = `data: ${JSON.stringify(event)}\n\n`;
        res.write(chunk);
      }
    } catch (error) {
      this.logger.error('Error in SSE relay', error);
      res.write(
        `data: ${JSON.stringify({ type: 'error', error: 'Streaming failed' })}\n\n`,
      );
    } finally {
      res.end();
    }
  }
}
