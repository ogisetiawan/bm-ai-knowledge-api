// FILE: apps/api-gateway/src/modules/auth/guards/menu-permission.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { MENU_KEY_METADATA } from '../decorators/menu-key.decorator';
import { REQUIRE_PERMISSION_METADATA } from '../decorators/require-permission.decorator';
import { MenuPermissionsService } from '../menu-permissions.service';

/**
 * Validates that the Core Bearer token has the required menu permission
 * for the target `menu_key` via `GET /auth/menupermissions`.
 *
 * Metadata:
 * - `@MenuKey('activity')`
 * - `@RequirePermission('show-detail-data')`
 *
 * Registered as `APP_GUARD` so it always runs. Routes without
 * `@RequirePermission` are skipped.
 */
@Injectable()
export class MenuPermissionGuard implements CanActivate {
  private readonly logger = new Logger(MenuPermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly menuPermissions: MenuPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRE_PERMISSION_METADATA,
      [context.getHandler(), context.getClass()],
    );
    const menuKey = this.reflector.getAllAndOverride<string | undefined>(
      MENU_KEY_METADATA,
      [context.getHandler(), context.getClass()],
    );

    // No permission metadata → skip (route is not menu-gated).
    if (!permission) {
      return true;
    }
    if (!menuKey) {
      throw new ForbiddenException('Menu key is not configured for this route');
    }

    const req = context.switchToHttp().getRequest<Request>();
    this.logger.log(
      `Checking menu="${menuKey}" permission="${permission}" path=${req.method} ${req.path}`,
    );

    const token = this.extractBearer(req.headers.authorization);
    const permissions = await this.menuPermissions.getPermissionsForMenu(
      token,
      menuKey,
    );

    if (!permissions.includes(permission)) {
      throw new ForbiddenException(
        `Missing permission "${permission}" for menu "${menuKey}"`,
      );
    }

    return true;
  }

  private extractBearer(authorization: string | undefined): string {
    if (!authorization) {
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
