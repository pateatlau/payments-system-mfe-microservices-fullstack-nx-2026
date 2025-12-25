/**
 * Swagger/OpenAPI Setup Module
 *
 * POC-3: Interactive API documentation with Swagger UI
 *
 * Serves Swagger UI at /api-docs for interactive API testing
 */

import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerOptions } from './openapi-spec';
import { logger } from '../utils/logger';

/**
 * Generate OpenAPI specification from options
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Swagger UI options for customization
 */
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { font-size: 2em }
    .swagger-ui .scheme-container { background: #fafafa; padding: 15px }
  `,
  customSiteTitle: 'MFE POC-3 API Documentation',
  swaggerOptions: {
    persistAuthorization: true, // Keep auth token across page refreshes
    displayRequestDuration: true, // Show request duration
    filter: true, // Enable filtering
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true, // Enable "Try it out" by default
  },
};

/**
 * Setup Swagger UI middleware
 *
 * @param app - Express application instance
 */
export function setupSwagger(app: Express): void {
  // Serve Swagger UI at /api-docs
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
  );

  // Serve raw OpenAPI spec as JSON at /api-docs.json
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve raw OpenAPI spec as YAML at /api-docs.yaml
  app.get('/api-docs.yaml', (_req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    const yaml = convertToYaml(swaggerSpec);
    res.send(yaml);
  });

  logger.info('Swagger UI initialized', {
    uiPath: '/api-docs',
    jsonPath: '/api-docs.json',
    yamlPath: '/api-docs.yaml',
  });
}

/**
 * Simple JSON to YAML converter for OpenAPI spec
 * (Basic implementation - for production use a proper YAML library)
 */
function convertToYaml(obj: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);

  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'boolean' || typeof obj === 'number') {
    return String(obj);
  }

  if (typeof obj === 'string') {
    // Handle multiline strings
    if (obj.includes('\n')) {
      const lines = obj.split('\n');
      return `|\n${lines.map(line => spaces + '  ' + line).join('\n')}`;
    }
    // Quote strings that might be interpreted as other types
    if (
      obj === '' ||
      obj === 'true' ||
      obj === 'false' ||
      obj === 'null' ||
      /^[\d.]+$/.test(obj) ||
      obj.includes(':') ||
      obj.includes('#') ||
      obj.includes("'") ||
      obj.includes('"')
    ) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]';
    }
    return obj
      .map(item => {
        const value = convertToYaml(item, indent + 1);
        if (typeof item === 'object' && item !== null) {
          return `${spaces}- ${value
            .trim()
            .replace(/^\s+/gm, match => spaces + '  ' + match.trim() + '\n')
            .trim()}`;
        }
        return `${spaces}- ${value}`;
      })
      .join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }
    return entries
      .map(([key, value]) => {
        const yamlValue = convertToYaml(value, indent + 1);
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          return `${spaces}${key}:\n${yamlValue}`;
        }
        if (Array.isArray(value) && value.length > 0) {
          return `${spaces}${key}:\n${yamlValue}`;
        }
        return `${spaces}${key}: ${yamlValue}`;
      })
      .join('\n');
  }

  return String(obj);
}

export { swaggerSpec as openApiSpec };
