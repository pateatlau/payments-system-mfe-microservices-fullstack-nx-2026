/**
 * Payments Service Configuration
 */

export const config = {
  port: parseInt(process.env['PORT'] || '3002', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',

  // API Gateway
  apiGatewayUrl: process.env['API_GATEWAY_URL'] || 'http://localhost:3000',

  // Event Hub
  eventHubUrl: process.env['EVENT_HUB_URL'] || 'http://localhost:3005',

  // Logging
  logLevel: process.env['LOG_LEVEL'] || 'info',

  // Pagination
  defaultPageSize: 10,
  maxPageSize: 100,
} as const;
