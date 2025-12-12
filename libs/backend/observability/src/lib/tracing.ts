/**
 * OpenTelemetry Distributed Tracing
 *
 * Provides centralized OpenTelemetry tracing initialization for all backend services.
 * Supports distributed tracing across microservices with correlation IDs.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export interface TracingConfig {
  serviceName: string;
  serviceVersion?: string;
  otlpEndpoint?: string;
  enabled?: boolean;
}

/**
 * Initialize OpenTelemetry tracing for a backend service
 *
 * @param config - Tracing configuration
 * @returns NodeSDK instance (can be used for shutdown)
 */
export function initTracing(config: TracingConfig): NodeSDK | null {
  const {
    serviceName,
    serviceVersion = process.env.npm_package_version || '0.0.1',
    otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      'http://localhost:4318/v1/traces',
    enabled = process.env.OTEL_ENABLED !== 'false',
  } = config;

  // Skip initialization if disabled
  if (!enabled) {
    console.warn(
      `[OpenTelemetry] Tracing disabled for ${serviceName}, skipping initialization`
    );
    return null;
  }

  // Skip initialization if endpoint is not configured (optional in development)
  if (!otlpEndpoint || otlpEndpoint === '') {
    console.warn(
      `[OpenTelemetry] OTLP endpoint not configured for ${serviceName}, skipping initialization`
    );
    return null;
  }

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
        process.env.NODE_ENV || 'development',
    }),
    traceExporter: new OTLPTraceExporter({
      url: otlpEndpoint,
      // Optional: Add headers for authentication if needed
      // headers: {
      //   'Authorization': `Bearer ${process.env.OTEL_AUTH_TOKEN}`,
      // },
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable fs instrumentation to reduce noise (optional)
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
  });

  try {
    sdk.start();
    console.log(
      `[OpenTelemetry] Tracing initialized for ${serviceName} (endpoint: ${otlpEndpoint})`
    );
  } catch (error) {
    console.error(
      `[OpenTelemetry] Failed to initialize tracing for ${serviceName}:`,
      error
    );
    return null;
  }

  // Graceful shutdown handler
  const shutdownHandler = async (): Promise<void> => {
    try {
      await sdk.shutdown();
      console.log(`[OpenTelemetry] Tracing terminated for ${serviceName}`);
    } catch (error) {
      console.error(
        `[OpenTelemetry] Error terminating tracing for ${serviceName}:`,
        error
      );
    }
  };

  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);

  return sdk;
}
