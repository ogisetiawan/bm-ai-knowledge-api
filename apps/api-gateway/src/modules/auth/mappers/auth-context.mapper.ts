// FILE: apps/api-gateway/src/modules/auth/mappers/auth-context.mapper.ts
import { AuthContext } from '@auth/index';
import { UserData } from '../interfaces/core-profile.interface';

/**
 * Maps Core `GET /auth/profile` (`UserData`) onto the normalized {@link AuthContext}.
 */
export class AuthContextMapper {
  static toAuthContext(user: UserData): AuthContext {
    return {
      userId: user.user_id ?? null,
      appCode:
        user.auth_user_applications?.[0]?.applications?.application_code ??
        null,
      roles: user.auth_user_roles?.[0]?.auth_roles?.role_name ?? null,
      employee: user.employee ?? null,
    };
  }
}
