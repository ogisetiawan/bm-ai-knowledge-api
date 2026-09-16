// FILE: apps/api-gateway/src/config/configuration.ts
/**
 * Central configuration loader for api-gateway.
 * This is the ONLY file allowed to read `process.env` — everything
 * else must inject ConfigService (coding-rules §8.1).
 */
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  gateway: {
    port: parseInt(process.env.GATEWAY_PORT ?? '3000', 10),
    apiKey: process.env.GATEWAY_API_KEY,
  },
  core: {
    baseUrl: process.env.CORE_BASE_URL,
    appCode: process.env.CORE_APP_CODE,
  },
  services: {
    baseUrl: process.env.SERVICES_BASE_URL ?? 'http://localhost:3001',
  },
  aiOrchestrator: {
    baseUrl: process.env.AI_ORCHESTRATOR_BASE_URL,
    apiKey: process.env.AI_ORCHESTRATOR_API_KEY,
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
  },
  security: {
    // Used from STEP 4 (internal token signing).
    internalJwtPrivateKey: process.env.INTERNAL_JWT_PRIVATE_KEY ?? '',
    internalJwtPublicKey: process.env.INTERNAL_JWT_PUBLIC_KEY ?? '',
  },
});
