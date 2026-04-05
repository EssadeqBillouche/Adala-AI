import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiEngineAskRequest {
  question: string;
  tenant_id: string;
  n_results?: number;
  stream?: boolean;
}

export interface AiEngineDocument {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface AiEngineSseEvent {
  type: string;
  content?: string;
  answer?: string;
  documents?: AiEngineDocument[];
  sources?: string[];
  error?: string;
}

/**
 * Service that communicates with the FastAPI AI Engine.
 * Uses native Node.js fetch (available in Node 20+) to call
 * the AI engine's POST /v1/ask endpoint and relay SSE events.
 */
@Injectable()
export class AiEngineService implements OnModuleInit {
  private readonly logger = new Logger(AiEngineService.name);
  private aiEngineUrl: string;
  private apiSecret: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.aiEngineUrl =
      this.configService.get<string>('AI_ENGINE_URL', 'http://localhost:8000');
    this.apiSecret = this.configService.get<string>('INTERNAL_API_SECRET');
  }

  onModuleInit() {
    this.logger.log(`AI Engine URL: ${this.aiEngineUrl}`);
  }

  /**
   * Call the AI engine's POST /v1/ask endpoint with stream=true
   * and return an async iterable that yields parsed SSE events.
   */
  async *streamAsk(
    request: AiEngineAskRequest,
  ): AsyncGenerator<AiEngineSseEvent, void, unknown> {
    const url = `${this.aiEngineUrl}/v1/ask`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': request.tenant_id,
    };

    if (this.apiSecret) {
      headers['X-API-Secret'] = this.apiSecret;
    }

    this.logger.log(
      `Streaming ask to AI engine: ${url} (tenant: ${request.tenant_id})`,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question: request.question,
        tenant_id: request.tenant_id,
        n_results: request.n_results ?? 5,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `AI engine returned ${response.status}: ${errorText}`,
      );
      yield {
        type: 'error',
        error: `AI engine error (${response.status}): ${errorText}`,
      };
      return;
    }

    if (!response.body) {
      yield { type: 'error', error: 'No response body from AI engine' };
      return;
    }

    // Parse SSE stream from the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const lines = buffer.split('\n');
        // Keep the last incomplete chunk in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) {
            // Skip empty lines and comments
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6); // Remove 'data: ' prefix
            try {
              const event: AiEngineSseEvent = JSON.parse(dataStr);
              yield event;

              // Stop after 'end' or 'error' events
              if (event.type === 'end' || event.type === 'error') {
                return;
              }
            } catch (parseError) {
              this.logger.warn(
                `Failed to parse SSE event: ${dataStr}`,
              );
            }
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          try {
            const event: AiEngineSseEvent = JSON.parse(dataStr);
            yield event;
          } catch {
            this.logger.warn(
              `Failed to parse final SSE event: ${dataStr}`,
            );
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Non-streaming ask — returns the full response at once.
   */
  async ask(request: AiEngineAskRequest): Promise<{
    question: string;
    answer: string;
    documents: AiEngineDocument[];
    sources: string[];
  }> {
    const url = `${this.aiEngineUrl}/v1/ask`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': request.tenant_id,
    };

    if (this.apiSecret) {
      headers['X-API-Secret'] = this.apiSecret;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question: request.question,
        tenant_id: request.tenant_id,
        n_results: request.n_results ?? 5,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI engine error (${response.status}): ${errorText}`);
    }

    return response.json();
  }
}
