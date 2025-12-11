/**
 * Workbox TypeScript Definitions
 * Provides type definitions for Workbox service worker features
 */

interface ServiceWorkerGlobalScope {
  __WB_MANIFEST: Array<{ url: string; revision: string }>;
  skipWaiting(): void;
  clients: Clients;
}

interface ServiceWorkerRegistration {
  installing: ServiceWorker | null;
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
  scope: string;
  update(): Promise<void>;
  unregister(): Promise<boolean>;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
}

interface Navigator {
  serviceWorker: ServiceWorkerContainer;
}

interface ServiceWorkerContainer {
  register(
    scriptURL: string,
    options?: RegistrationOptions
  ): Promise<ServiceWorkerRegistration>;
  getRegistration(
    clientURL?: string
  ): Promise<ServiceWorkerRegistration | undefined>;
  getRegistrations(): Promise<ServiceWorkerRegistration[]>;
  controller: ServiceWorker | null;
  ready: Promise<ServiceWorkerRegistration>;
  addEventListener(
    type: 'controllerchange' | 'message',
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
}

interface RegistrationOptions {
  scope?: string;
  type?: 'classic' | 'module';
  updateViaCache?: 'imports' | 'all' | 'none';
}

interface Clients {
  claim(): Promise<void>;
  get(id: string): Promise<Client>;
  matchAll(options?: ClientQueryOptions): Promise<Client[]>;
  openWindow(url: string): Promise<WindowClient | null>;
}

interface ClientQueryOptions {
  includeUncontrolled?: boolean;
  type?: 'window' | 'worker' | 'sharedworker' | 'all';
}
