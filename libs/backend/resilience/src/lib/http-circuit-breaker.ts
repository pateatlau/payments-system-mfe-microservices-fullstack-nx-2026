/**
 * HTTP Client Circuit Breaker
 *
 * Provides circuit breaker wrapper for HTTP calls to other services.
 * Supports axios and fetch-based HTTP calls.
 *
 * Phase 5.1 - Service Resilience
 */

import {
  createCircuitBreaker,
  CircuitBreakerConfig,
  CircuitState,
  getCircuitState,
  getCircuitStats,
} from './circuit-breaker';

/**
 * Circuit breaker instance type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CircuitBreakerInstance = any;

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

/**
 * HTTP response
 */
export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

/**
 * HTTP circuit breaker configuration
 */
export interface HttpCircuitBreakerConfig extends Omit<CircuitBreakerConfig, 'name'> {
  /** Service name for circuit identification */
  serviceName: string;
  /** Base URL for the service */
  baseUrl: string;
  /** Default headers to include in all requests */
  defaultHeaders?: Record<string, string>;
  /** Custom HTTP client function (defaults to fetch) */
  httpClient?: (config: HttpRequestConfig) => Promise<HttpResponse>;
}

/**
 * Default HTTP client using fetch
 */
async function defaultHttpClient(config: HttpRequestConfig): Promise<HttpResponse> {
  const { url, method = 'GET', headers = {}, body, timeout = 10000 } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const data = await response.json().catch(() => null);

    // Treat 4xx and 5xx as errors to be counted by circuit breaker
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as Error & { status: number; data: unknown }).status = response.status;
      (error as Error & { status: number; data: unknown }).data = data;
      throw error;
    }

    return {
      status: response.status,
      data,
      headers: responseHeaders,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * HTTP Circuit Breaker client for inter-service communication
 */
export class HttpCircuitBreaker {
  private readonly breaker: CircuitBreakerInstance;
  private readonly serviceName: string;
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly httpClient: (config: HttpRequestConfig) => Promise<HttpResponse>;
  private readonly logger: (message: string, context: Record<string, unknown>) => void;

  constructor(config: HttpCircuitBreakerConfig) {
    const {
      serviceName,
      baseUrl,
      defaultHeaders = {},
      httpClient = defaultHttpClient,
      timeout = 10000,
      errorThresholdPercentage = 50,
      resetTimeout = 30000,
      volumeThreshold = 5,
      logger = (msg: string, ctx: Record<string, unknown>) => process.stdout.write(JSON.stringify({ message: msg, ...ctx }) + '\n'),
      fallback,
      onOpen,
      onClose,
      onHalfOpen,
      onSuccess,
      onFailure,
      onTimeout,
      onReject,
    } = config;

    this.serviceName = serviceName;
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = defaultHeaders;
    this.httpClient = httpClient;
    this.logger = (msg, ctx) => {
      if (typeof logger === 'function') {
        logger(msg, ctx);
      }
    };

    // Create circuit breaker for HTTP requests
    this.breaker = createCircuitBreaker(
      async (requestConfig: HttpRequestConfig) => {
        return this.httpClient({
          ...requestConfig,
          url: requestConfig.url.startsWith('http')
            ? requestConfig.url
            : `${this.baseUrl}${requestConfig.url}`,
          headers: {
            ...this.defaultHeaders,
            ...requestConfig.headers,
          },
        });
      },
      {
        name: `http-${serviceName}`,
        timeout,
        errorThresholdPercentage,
        resetTimeout,
        volumeThreshold,
        logger: this.logger,
        fallback: fallback as ((...args: unknown[]) => unknown) | undefined,
        onOpen,
        onClose,
        onHalfOpen,
        onSuccess,
        onFailure,
        onTimeout,
        onReject,
      }
    );
  }

  /**
   * Make a GET request
   */
  async get<T = unknown>(
    path: string,
    options?: { headers?: Record<string, string>; timeout?: number }
  ): Promise<HttpResponse<T>> {
    return this.breaker.fire({
      url: path,
      method: 'GET',
      headers: options?.headers,
      timeout: options?.timeout,
    }) as Promise<HttpResponse<T>>;
  }

  /**
   * Make a POST request
   */
  async post<T = unknown>(
    path: string,
    body?: unknown,
    options?: { headers?: Record<string, string>; timeout?: number }
  ): Promise<HttpResponse<T>> {
    return this.breaker.fire({
      url: path,
      method: 'POST',
      body,
      headers: options?.headers,
      timeout: options?.timeout,
    }) as Promise<HttpResponse<T>>;
  }

  /**
   * Make a PUT request
   */
  async put<T = unknown>(
    path: string,
    body?: unknown,
    options?: { headers?: Record<string, string>; timeout?: number }
  ): Promise<HttpResponse<T>> {
    return this.breaker.fire({
      url: path,
      method: 'PUT',
      body,
      headers: options?.headers,
      timeout: options?.timeout,
    }) as Promise<HttpResponse<T>>;
  }

  /**
   * Make a PATCH request
   */
  async patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: { headers?: Record<string, string>; timeout?: number }
  ): Promise<HttpResponse<T>> {
    return this.breaker.fire({
      url: path,
      method: 'PATCH',
      body,
      headers: options?.headers,
      timeout: options?.timeout,
    }) as Promise<HttpResponse<T>>;
  }

  /**
   * Make a DELETE request
   */
  async delete<T = unknown>(
    path: string,
    options?: { headers?: Record<string, string>; timeout?: number }
  ): Promise<HttpResponse<T>> {
    return this.breaker.fire({
      url: path,
      method: 'DELETE',
      headers: options?.headers,
      timeout: options?.timeout,
    }) as Promise<HttpResponse<T>>;
  }

  /**
   * Make a generic request
   */
  async request<T = unknown>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.breaker.fire(config) as Promise<HttpResponse<T>>;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return getCircuitState(`http-${this.serviceName}`) || CircuitState.CLOSED;
  }

  /**
   * Get circuit statistics
   */
  getStats() {
    return getCircuitStats(`http-${this.serviceName}`);
  }

  /**
   * Check if circuit is healthy (closed)
   */
  isHealthy(): boolean {
    return this.getState() === CircuitState.CLOSED;
  }

  /**
   * Get service name
   */
  getServiceName(): string {
    return this.serviceName;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Shutdown the circuit breaker
   */
  shutdown(): void {
    this.breaker.shutdown();
  }
}

/**
 * Factory function to create HTTP circuit breaker
 */
export function createHttpCircuitBreaker(config: HttpCircuitBreakerConfig): HttpCircuitBreaker {
  return new HttpCircuitBreaker(config);
}

/**
 * Pre-configured service clients registry
 */
const serviceClients = new Map<string, HttpCircuitBreaker>();

/**
 * Register a service client
 */
export function registerServiceClient(client: HttpCircuitBreaker): void {
  serviceClients.set(client.getServiceName(), client);
}

/**
 * Get a registered service client
 */
export function getServiceClient(serviceName: string): HttpCircuitBreaker | undefined {
  return serviceClients.get(serviceName);
}

/**
 * Get all registered service clients
 */
export function getAllServiceClients(): Map<string, HttpCircuitBreaker> {
  return new Map(serviceClients);
}

/**
 * Check health of all registered services
 */
export function getServicesHealth(): Record<string, { healthy: boolean; state: CircuitState }> {
  const health: Record<string, { healthy: boolean; state: CircuitState }> = {};

  for (const [name, client] of serviceClients) {
    const state = client.getState();
    health[name] = {
      healthy: state === CircuitState.CLOSED,
      state,
    };
  }

  return health;
}
