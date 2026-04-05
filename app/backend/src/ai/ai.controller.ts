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
    @Body() body: { question: string; conversationId?: string },
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    // Use the user's org ID as the tenant identifier
    const tenantId = user.orgId;

    this.logger.log(`Streaming request for tenant: ${tenantId}`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const event of this.aiEngineService.streamAsk({
        question: body.question,
        tenant_id: tenantId,
        n_results: 5,
      })) {
        // Forward the SSE event to the client
        res.write(`data: ${JSON.stringify(event)}\n\n`);

        // Flush the response
        if ((res as any).flush) {
          (res as any).flush();
        }
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
