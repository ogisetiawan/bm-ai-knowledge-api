// FILE: apps/api-gateway/src/config/validation.schema.ts
import * as Joi from 'joi';

/**
 * Gateway env validation (coding-rules §8.2) — the app refuses to boot
 * when required variables are missing or malformed.
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  GATEWAY_PORT: Joi.number().port().default(3000),
  CORE_BASE_URL: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  CORE_APP_CODE: Joi.string().min(1).required(),
  SERVICES_BASE_URL: Joi.string().uri().default('http://localhost:3001'),
  AI_ORCHESTRATOR_BASE_URL: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  AI_ORCHESTRATOR_API_KEY: Joi.string().min(8).required(),
  SWAGGER_ENABLED: Joi.boolean().default(false),
  GATEWAY_API_KEY: Joi.string().min(32).required(),
  // Required from STEP 4 (internal JWT); optional until then.
  INTERNAL_JWT_PRIVATE_KEY: Joi.string().base64().allow('').default(''),
  INTERNAL_JWT_PUBLIC_KEY: Joi.string().base64().allow('').default(''),
});
