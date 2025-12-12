# Service Worker Implementation

## Overview

The Shell app includes a production-ready service worker implementation using Workbox for offline support, asset caching, and improved performance.

## Features

### Caching Strategies

1. **Precaching (Static Assets)**
   - All static assets (JS, CSS, HTML, images) are precached during service worker installation
   - Uses `precacheAndRoute()` from Workbox
   - Automatically managed by build process

2. **API Cache (NetworkFirst)**
   - API responses cached with NetworkFirst strategy
   - Network timeout: 5 seconds
   - Cache fallback if network fails
   - Max 100 entries, 5 minute TTL

3. **Images (CacheFirst)**
   - Images cached with CacheFirst strategy
   - Max 60 entries, 30 day TTL
   - Reduces bandwidth usage

4. **JS/CSS (StaleWhileRevalidate)**
   - Scripts and styles use StaleWhileRevalidate
   - Returns cached version while fetching update
   - Max 50 entries, 7 day TTL

5. **Fonts (CacheFirst)**
   - Fonts cached with CacheFirst strategy
   - Max 30 entries, 1 year TTL

6. **Module Federation Remotes (NetworkFirst)**
   - Remote entry files use NetworkFirst
   - Network timeout: 3 seconds
   - Max 10 entries, 1 hour TTL

### Offline Support

- Offline fallback page (`/offline.html`)
- Automatic retry when connection restored
- User-friendly offline experience

## Files

```
apps/shell/
├── src/
│   ├── sw.ts                      # Service worker implementation
│   ├── utils/
│   │   ├── register-sw.ts         # Registration utility
│   │   └── register-sw.test.ts    # Tests
│   └── types/
│       └── workbox.d.ts           # TypeScript definitions
├── public/
│   └── offline.html               # Offline fallback page
└── workbox-config.js              # Workbox configuration
```

## Usage

### Automatic Registration

The service worker is automatically registered in production mode:

```typescript
// In bootstrap.tsx
import { registerServiceWorker } from './utils/register-sw';

// Registers SW in production only
registerServiceWorker();
```

### Development Mode

Service worker is disabled in development mode to avoid caching issues during development.

### Manual Control

```typescript
import {
  registerServiceWorker,
  unregisterServiceWorker,
  isServiceWorkerRegistered,
  getServiceWorkerRegistration,
} from './utils/register-sw';

// Register service worker
registerServiceWorker();

// Unregister service worker
await unregisterServiceWorker();

// Check if registered
const isRegistered = await isServiceWorkerRegistered();

// Get registration
const registration = await getServiceWorkerRegistration();
```

## Testing

### Unit Tests

Run service worker tests:

```bash
pnpm sw:test
```

### Manual Testing

1. Build the app:

```bash
pnpm build:shell
```

2. Serve the build:

```bash
pnpm preview:shell
```

3. Open DevTools:
   - Go to Application > Service Workers
   - Verify service worker is registered
   - Check Cache Storage for cached assets

4. Test offline:
   - Disconnect from network (DevTools > Network > Offline)
   - Refresh page - should show offline page
   - Navigate to cached pages - should work

### Verification Script

```bash
pnpm sw:verify
```

This builds the shell and verifies the service worker file exists.

## Cache Management

### View Cache

```bash
# Open DevTools > Application > Cache Storage
# Or use Cache API in console:
caches.keys().then(console.log)
```

### Clear Cache

The service worker automatically cleans up outdated caches. To manually clear:

```typescript
// In browser console
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

Or clear Redis cache (backend):

```bash
pnpm cache:clear
```

## Update Strategy

When a new service worker is available:

1. User is prompted to reload the app
2. Service worker updates in the background
3. New version activates after reload

```typescript
// Update prompt shown via confirm dialog
if (confirm('A new version is available. Reload to update the app?')) {
  // Triggers update and reload
}
```

## Performance Benefits

- **Reduced Network Requests**: Cached assets served instantly
- **Faster Load Times**: Precached assets load immediately
- **Offline Support**: App works without internet
- **Bandwidth Savings**: Images and fonts cached long-term
- **Improved UX**: Stale-while-revalidate for instant responses

## Browser Support

Service workers are supported in:

- Chrome/Edge 40+
- Firefox 44+
- Safari 11.1+
- Opera 27+

The implementation gracefully degrades in unsupported browsers.

## Configuration

### Workbox Config

Edit `apps/shell/workbox-config.js` to customize:

- Cache patterns
- File size limits
- Navigation fallbacks
- Runtime caching rules

### Caching Strategies

Adjust strategies in `apps/shell/src/sw.ts`:

```typescript
// Example: Change API cache to CacheFirst
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new CacheFirst({
    cacheName: 'api-cache',
    // ... options
  })
);
```

## Troubleshooting

### Service Worker Not Registering

1. Check browser console for errors
2. Verify HTTPS or localhost
3. Check `NODE_ENV === 'production'`
4. Verify `/sw.js` file exists in build output

### Cache Not Updating

1. Unregister service worker in DevTools
2. Clear cache storage
3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. Rebuild and redeploy

### Offline Page Not Showing

1. Check `/offline.html` exists in public folder
2. Verify offline event handler in `sw.ts`
3. Test network offline in DevTools

## Scripts

```bash
# Run service worker tests
pnpm sw:test

# Verify service worker build
pnpm sw:verify

# Clear all caches (Redis)
pnpm cache:clear

# Check cache status
pnpm cache:status
```

## Related Documentation

- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Module Federation with Service Workers](https://module-federation.io/)

## Notes

- Service worker only runs in production builds
- HTTPS is required (except localhost)
- Cache is per-origin
- Service worker scope is `/`
- Update checks happen automatically every hour
- Module Federation remotes are cached with short TTL to ensure updates
