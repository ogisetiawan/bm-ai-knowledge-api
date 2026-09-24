// FILE: apps/api-gateway/src/modules/auth/guards/menu-permission.guard.spec.ts
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MenuPermissionGuard } from './menu-permission.guard';
import { MenuPermissionsService } from '../menu-permissions.service';

describe('MenuPermissionGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const menuPermissions = {
    getPermissionsForMenu: jest.fn(),
  };

  const guard = new MenuPermissionGuard(
    reflector as unknown as Reflector,
    menuPermissions as unknown as MenuPermissionsService,
  );

  const makeContext = (authorization?: string) =>
    ({
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          path: '/conversations',
          headers: { authorization },
        }),
      }),
    }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips when @RequirePermission is absent (happy open route)', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);

    await expect(guard.canActivate(makeContext('Bearer t'))).resolves.toBe(
      true,
    );
    expect(menuPermissions.getPermissionsForMenu).not.toHaveBeenCalled();
  });

  it('allows when Core grants the required permission (happy path)', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce('show-list-data')
      .mockReturnValueOnce('chat');
    menuPermissions.getPermissionsForMenu.mockResolvedValue(['show-list-data']);

    await expect(guard.canActivate(makeContext('Bearer t'))).resolves.toBe(
      true,
    );
    expect(menuPermissions.getPermissionsForMenu).toHaveBeenCalledWith(
      't',
      'chat',
    );
  });

  it('rejects when permission is missing (sad path)', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce('show-fffff-data')
      .mockReturnValueOnce('chat');
    menuPermissions.getPermissionsForMenu.mockResolvedValue(['show-list-data']);

    await expect(guard.canActivate(makeContext('Bearer t'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects when menu key metadata is missing (sad path)', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce('show-list-data')
      .mockReturnValueOnce(undefined);

    await expect(guard.canActivate(makeContext('Bearer t'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects when bearer token is missing (sad path)', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce('show-list-data')
      .mockReturnValueOnce('chat');

    await expect(guard.canActivate(makeContext(undefined))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
