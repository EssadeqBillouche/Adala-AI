import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    
    // AuthGuard (JwtStrategy) will have hydrated req.user if logged in
    if (user?.orgId) {
      this.cls.set('tenantId', user.orgId);
    }

    return next.handle();
  }
}
