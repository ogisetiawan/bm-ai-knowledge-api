// FILE: apps/api-gateway/src/modules/auth/mappers/session.mapper.ts
import { BadGatewayException } from '@nestjs/common';
import { SessionResponseDto } from '../dto/session.response';
import {
  isRecord,
  UserData,
} from '../interfaces/core-profile.interface';

export interface SessionSources {
  user: UserData;
  menus: unknown;
  menuPermissions: unknown;
}

/**
 * Maps Core profile + menus + menu permissions onto the session DTO.
 * Profile keeps only the four fields in API_CORE.md. Menus and menu
 * permissions keep Core `data` only (`records` and `meta`).
 */
export class SessionMapper {
  static toResponse(sources: SessionSources): SessionResponseDto {
    const user = sources.user;
    return {
      auth_user_applications:
        user?.auth_user_applications?.[0]?.applications?.application_code ??
        null,
      auth_user_roles:
        user?.auth_user_roles?.[0]?.auth_roles?.role_name ?? null,
      user_id: user?.user_id ?? null,
      employee: user?.employee ?? null,
      menus: SessionMapper.asCoreData(sources.menus, 'menus'),
      menupermissions: SessionMapper.asCoreData(
        sources.menuPermissions,
        'menupermissions',
      ),
    };
  }

  /** Core envelope `{ status, message, data }` — session keeps `data`. */
  private static asCoreData(
    value: unknown,
    label: string,
  ): Record<string, unknown> {
    if (!isRecord(value) || !isRecord(value['data'])) {
      throw new BadGatewayException(`Core ${label} response is invalid`);
    }
    return value['data'];
  }
}
