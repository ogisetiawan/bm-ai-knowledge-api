// FILE: apps/api-gateway/src/modules/auth/session.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { CoreClient } from './core.client';
import { SessionSources } from './mappers/session.mapper';
import { ProfileService } from './profile.service';

/**
 * Loads the signed-in session from Core: profile, menus, and menu permissions.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly profile: ProfileService,
    private readonly core: CoreClient,
  ) {}

  async load(req: Request): Promise<SessionSources> {
    const token = this.extractBearer(req.headers.authorization);
    const [user, menus, menuPermissions] = await Promise.all([
      this.profile.getProfile(token),
      this.core.fetchMenus(token),
      this.core.fetchMenuPermissions(token),
    ]);
    return { user, menus, menuPermissions };
  }

  private extractBearer(authorization: string | undefined): string {
    if (typeof authorization !== 'string' || authorization.trim().length === 0) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let token = authorization.trim();
    while (/^Bearer\s+/i.test(token)) {
      token = token.replace(/^Bearer\s+/i, '').trim();
    }
    if (token.length === 0) {
      throw new UnauthorizedException('Missing bearer token');
    }
    return token;
  }
}
