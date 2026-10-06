// FILE: apps/api-gateway/src/modules/auth/dto/session.response.ts
import { ApiProperty } from '@nestjs/swagger';
import { Employee } from '../interfaces/core-profile.interface';

/**
 * Gateway session: four profile fields, plus Core menus and
 * menu-permissions `data` (API_CORE.md MERGE /session).
 */
export class SessionResponseDto {
  @ApiProperty({
    nullable: true,
    description: 'application_code of the first auth_user_applications entry',
  })
  auth_user_applications!: string | null;

  @ApiProperty({
    nullable: true,
    description: 'role_name of the first auth_user_roles entry',
  })
  auth_user_roles!: string | null;

  @ApiProperty({ nullable: true })
  user_id!: string | null;

  @ApiProperty({
    nullable: true,
    type: 'object',
    additionalProperties: true,
    description: 'Core profile employee object, or null',
  })
  employee!: Employee | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Core GET /auth/menus response data (records and meta)',
  })
  menus!: Record<string, unknown>;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Core GET /auth/menupermissions response data (records and meta)',
  })
  menupermissions!: Record<string, unknown>;
}
