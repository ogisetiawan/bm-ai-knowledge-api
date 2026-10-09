/**
 * PM2 process for the NestJS API gateway.
 * Interpreter is pinned to Node 24 so the system Node 20 install stays untouched.
 * Other required variables stay in the server .env; this file only pins the port.
 *
 * Start: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: "bm-ai-knowledge-api",
      cwd: __dirname,
      namespace: "bm-ai",
      script: "dist/apps/api-gateway/apps/api-gateway/src/main.js",
      interpreter: "C:/_RUNTIME/node-v24.21.0/node.exe",
      node_args: "--max-http-header-size=32768",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      kill_timeout:5000,
      time:true,
      env: {
        NODE_ENV: "production",
        GATEWAY_PORT: "8100",
      },
    },
  ],
};
