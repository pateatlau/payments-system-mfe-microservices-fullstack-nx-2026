/**
 * Service Worker Registration
 * Registers the service worker for offline support and caching
 */

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          // eslint-disable-next-line no-console
          console.log('[SW] Registered:', registration.scope);

          // Check for updates every hour
          setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000
          ); // 1 hour

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  // eslint-disable-next-line no-console
                  console.log('[SW] New version available. Reload to update.');
                  // Optionally show a notification to the user
                  if (
                    confirm(
                      'A new version is available. Reload to update the app?'
                    )
                  ) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error('[SW] Registration failed:', error);
        });

      // Reload page when new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  } else if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[SW] Service worker disabled in development mode');
  }
}

/**
 * Unregister service worker (useful for testing)
 */
export async function unregisterServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    // eslint-disable-next-line no-console
    console.log('[SW] Unregistered all service workers');
  }
}

/**
 * Check if service worker is registered
 */
export async function isServiceWorkerRegistered(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration !== undefined;
  }
  return false;
}

/**
 * Get service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<
  ServiceWorkerRegistration | undefined
> {
  if ('serviceWorker' in navigator) {
    return await navigator.serviceWorker.getRegistration();
  }
  return undefined;
}
