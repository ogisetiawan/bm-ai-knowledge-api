// FILE: apps/api-gateway/src/interceptors/context-injection.interceptor.spec.ts
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AuthContext, InternalJwtService } from '@auth/index';
import { HEADERS } from '@common/index';
import { AuthService } from '../modules/auth/auth.service';
import { ContextInjectionInterceptor } from './context-injection.interceptor';

describe('ContextInjectionInterceptor', () => {
  const auth = { getAuthContext: jest.fn() };
  const internalJwt = { sign: jest.fn() };
  const config = { getOrThrow: jest.fn() };
  const interceptor = new ContextInjectionInterceptor(
    auth as unknown as AuthService,
    internalJwt as unknown as InternalJwtService,
    config as unknown as ConfigService,
  );

  function contextFor(path: string) {
    const req = { path, headers: {} as Record<string, string> };
    const next = { handle: jest.fn().mockReturnValue(of(undefined)) };
    const context = {
      switchToHttp: () => ({ getRequest: () => req }),
    };
    return { req, next, context };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips auth injection on GET /sessions', async () => {
    const { context, next } = contextFor('/api/v1/sessions');

    await interceptor.intercept(context as never, next as never);

    expect(auth.getAuthContext).not.toHaveBeenCalled();
    expect(next.handle).toHaveBeenCalled();
  });

  it('skips routes outside the proxy prefixes', async () => {
    const { context, next } = contextFor('/health');

    await interceptor.intercept(context as never, next as never);

    expect(auth.getAuthContext).not.toHaveBeenCalled();
    expect(next.handle).toHaveBeenCalled();
  });

  it('injects trust-boundary headers on proxied /api routes', async () => {
    const authContext = { userId: 'user-1' } as AuthContext;
    auth.getAuthContext.mockResolvedValue(authContext);
    internalJwt.sign.mockReturnValue('signed');
    config.getOrThrow.mockReturnValue('gateway-key');
    const { context, next, req } = contextFor('/api/v1/conversations');

    await interceptor.intercept(context as never, next as never);

    expect(auth.getAuthContext).toHaveBeenCalled();
    expect(req.headers[HEADERS.API_KEY]).toBe('gateway-key');
    expect(req.headers[HEADERS.INTERNAL_TOKEN]).toBe('signed');
    expect(req.headers[HEADERS.REQUEST_ID]).toEqual(expect.any(String));
    expect(next.handle).toHaveBeenCalled();
  });

  it('propagates Core auth failure on proxied routes', async () => {
    auth.getAuthContext.mockRejectedValue(
      new UnauthorizedException('Missing bearer token'),
    );
    const { context, next } = contextFor('/api/v1/conversations');

    await expect(
      interceptor.intercept(context as never, next as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(next.handle).not.toHaveBeenCalled();
  });
});