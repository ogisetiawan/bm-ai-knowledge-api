// FILE: apps/api-gateway/src/interceptors/context-injection.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { AuthContext, InternalJwtService } from '@auth/index';
import { HEADERS } from '@common/index';
import { AuthService } from '../modules/auth/auth.service';

export type RequestWithAuth = Request & { auth?: AuthContext };

const PROXY_PREFIXES = ['/api', '/activities'] as const;
const SESSION_PATHS = ['/api/v1/sessions', '/sessions'] as const;

/**
 * Global interceptor — active on proxied `/api/*` and `/activities/*` routes.
 * Builds the AuthContext after Core validates the Bearer token via profile,
 * signs the 30s internal token, and injects the trust-boundary headers
 * (`x-api-key`, `x-user-data`, `x-internal-token`, `x-request-id`)
 * before the proxy forwards the request to api-services.
 */
@Injectable()
export class ContextInjectionInterceptor implements NestInterceptor {
  constructor(
    private readonly auth: AuthService,
    private readonly internalJwt: InternalJwtService,
    private readonly config: ConfigService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<RequestWithAuth>();

    // Session reads Core itself. Skip the proxy header injection so this
    // route does not call /auth/profile a second time.
    if (this.isSessionRoute(req.path)) {
      return next.handle();
    }

    if (!PROXY_PREFIXES.some((prefix) => this.matchesPrefix(req.path, prefix))) {
      return next.handle();
    }

    const authContext = await this.auth.getAuthContext(req);
    req.auth = authContext;

    req.headers[HEADERS.API_KEY] = this.config.getOrThrow<string>('gateway.apiKey');
    req.headers[HEADERS.USER_DATA] = Buffer.from(
      JSON.stringify(authContext),
      'utf8',
    ).toString('base64');
    req.headers[HEADERS.INTERNAL_TOKEN] = this.internalJwt.sign(authContext);
    req.headers[HEADERS.REQUEST_ID] = randomUUID();

    return next.handle();
  }

  private isSessionRoute(path: string): boolean {
    return (SESSION_PATHS as readonly string[]).includes(path);
  }

  private matchesPrefix(path: string, prefix: string): boolean {
    return path === prefix || path.startsWith(`${prefix}/`);
  }
}
