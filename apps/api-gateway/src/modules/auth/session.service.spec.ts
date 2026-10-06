// FILE: apps/api-gateway/src/modules/auth/session.service.spec.ts
import { UnauthorizedException } from '@nestjs/common';
import { CoreClient } from './core.client';
import { UserData } from './interfaces/core-profile.interface';
import { ProfileService } from './profile.service';
import { SessionService } from './session.service';

describe('SessionService', () => {
  const profile = { getProfile: jest.fn() };
  const core = { fetchMenus: jest.fn(), fetchMenuPermissions: jest.fn() };
  const service = new SessionService(
    profile as unknown as ProfileService,
    core as unknown as CoreClient,
  );

  const user = { user_id: 'user-1' } as UserData;
  const menus = { status: true, data: { records: [] } };
  const menuPermissions = { status: true, data: { records: [] } };

  beforeEach(() => {
    jest.clearAllMocks();
    profile.getProfile.mockResolvedValue(user);
    core.fetchMenus.mockResolvedValue(menus);
    core.fetchMenuPermissions.mockResolvedValue(menuPermissions);
  });

  it('loads profile, menus, and menu permissions with the bearer token', async () => {
    const result = await service.load({
      headers: { authorization: 'Bearer token-1' },
    } as never);

    expect(profile.getProfile).toHaveBeenCalledWith('token-1');
    expect(core.fetchMenus).toHaveBeenCalledWith('token-1');
    expect(core.fetchMenuPermissions).toHaveBeenCalledWith('token-1');
    expect(result).toEqual({ user, menus, menuPermissions });
  });

  it('strips a repeated Bearer prefix before calling Core', async () => {
    await service.load({
      headers: { authorization: 'Bearer Bearer token-1' },
    } as never);

    expect(profile.getProfile).toHaveBeenCalledWith('token-1');
  });

  it('rejects a missing bearer token', async () => {
    await expect(
      service.load({ headers: {} } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(profile.getProfile).not.toHaveBeenCalled();
  });

  it('propagates a Core rejection from profile', async () => {
    profile.getProfile.mockRejectedValue(
      new UnauthorizedException('Core rejected the bearer token'),
    );

    await expect(
      service.load({ headers: { authorization: 'Bearer token-1' } } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
