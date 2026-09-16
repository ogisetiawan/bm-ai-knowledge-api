// FILE: apps/api-gateway/src/modules/auth/menu-permissions.service.ts
import {
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { CoreMenuPermission } from './interfaces/core-menu-permission.interface';

const CORE_TIMEOUT_MS = 5000;

/**
 * Fetches menu permissions from Core for the current Bearer token.
 */
@Injectable()
export class MenuPermissionsService {
  private readonly logger = new Logger(MenuPermissionsService.name);
  private readonly baseUrl: string;
  private readonly isDev: boolean;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.getOrThrow<string>('core.baseUrl').replace(/\/+$/, '');
    this.isDev = config.get<string>('nodeEnv') !== 'production';
  }

  /** GET {CORE_BASE_URL}/auth/menupermissions */
  async getMenuPermissions(userJwt: string): Promise<CoreMenuPermission[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<unknown>(`${this.baseUrl}/auth/menupermissions`, {
          headers: { Authorization: `Bearer ${userJwt}` },
          timeout: CORE_TIMEOUT_MS,
        }),
      );

      // if (this.isDev) {
      //   this.logger.debug(
      //     `Core menupermissions raw response: ${JSON.stringify(data)}`,
      //   );
      // }

      const menus = this.normalize(data);
      if (this.isDev) {
        this.logger.debug(
          `Core menupermissions menus: ${menus.map((m) => m.menu_key).join(', ') || '(empty)'}`,
        );
      }
      return menus;
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  /**
   * Returns permissions for a menu_key, or [] if the menu is absent.
   */
  async getPermissionsForMenu(
    userJwt: string,
    menuKey: string,
  ): Promise<string[]> {
    const menus = await this.getMenuPermissions(userJwt);
    const match = menus.find((menu) => menu.menu_key === menuKey);
    return match?.permissions ?? [];
  }

  private normalize(data: unknown): CoreMenuPermission[] {
    const list = this.asList(data);
    return list
      .map((item) => this.asMenu(item))
      .filter((item): item is CoreMenuPermission => item !== null);
  }

  private asList(data: unknown): unknown[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data !== 'object' || data === null) {
      return [];
    }

    const root = data as Record<string, unknown>;

    // Core envelope: { status, message, data: { records: [...], meta } }
    const nested = root['data'];
    if (typeof nested === 'object' && nested !== null) {
      const nestedRecord = nested as Record<string, unknown>;
      if (Array.isArray(nestedRecord['records'])) {
        return nestedRecord['records'];
      }
    }

    // Fallback shapes
    if (Array.isArray(root['data'])) {
      return root['data'];
    }
    if (Array.isArray(root['records'])) {
      return root['records'];
    }
    if (Array.isArray(root['menus'])) {
      return root['menus'];
    }
    if (typeof root['menu_key'] === 'string') {
      return [data];
    }
    return [];
  }

  private asMenu(item: unknown): CoreMenuPermission | null {
    if (typeof item !== 'object' || item === null) {
      return null;
    }
    const record = item as Record<string, unknown>;
    const menuKey = record['menu_key'];
    const permissions = record['permissions'];
    if (typeof menuKey !== 'string') {
      return null;
    }
    if (!Array.isArray(permissions)) {
      return { menu_key: menuKey, permissions: [] };
    }
    return {
      menu_key: menuKey,
      permissions: permissions.filter(
        (permission): permission is string => typeof permission === 'string',
      ),
    };
  }

  private toHttpException(error: unknown): HttpException {
    if (error instanceof AxiosError && error.response) {
      if (error.response.status === 401) {
        return new UnauthorizedException('Core rejected the bearer token');
      }
      return new HttpException(
        'Core menu permissions request failed',
        error.response.status,
      );
    }
    return new ServiceUnavailableException('Core service is unavailable');
  }
}
