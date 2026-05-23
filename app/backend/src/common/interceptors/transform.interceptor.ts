import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> | Observable<any> {
    const res = context.switchToHttp().getResponse();

    // Skip transformation for SSE (text/event-stream) responses
    const contentType = res.getHeader?.('Content-Type') || '';
    if (typeof contentType === 'string' && contentType.includes('text/event-stream')) {
      return next.handle();
    }

    const status = res.statusCode;

    return next.handle().pipe(
      map((data) => ({
        statusCode: status,
        message: 'Request successful',
        data: data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}