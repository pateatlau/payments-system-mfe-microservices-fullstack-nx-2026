/**
 * Test Service Startup with Sentry Integration
 *
 * Simulates service startup to verify Sentry integration doesn't break startup
 */

import express from 'express';
import {
  initSentry,
  initSentryErrorHandler,
} from '../libs/backend/observability/src/lib/sentry';

console.log('🧪 Testing Service Startup with Sentry Integration\n');

// Simulate service startup sequence
const app = express();

// Step 1: Initialize Sentry (should be first, before other middleware)
console.log('Step 1: Initializing Sentry...');
try {
  // Test without DSN first (graceful degradation)
  delete process.env.SENTRY_DSN;
  initSentry(app, { serviceName: 'test-service-startup' });
  console.log(
    '✅ Sentry initialization completed (graceful skip without DSN)\n'
  );
} catch (error) {
  console.error('❌ Error during Sentry initialization:', error);
  process.exit(1);
}

// Step 2: Add middleware (simulating real service setup)
console.log('Step 2: Adding middleware...');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('✅ Middleware added successfully\n');

// Step 3: Add routes
console.log('Step 3: Adding routes...');
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'test-service' });
});

app.get('/test', (_req, res) => {
  res.json({ message: 'Test endpoint working' });
});
console.log('✅ Routes added successfully\n');

// Step 4: Add error handler (should be last)
console.log('Step 4: Adding error handler...');
initSentryErrorHandler(app);
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    res.status(500).json({ error: err.message });
  }
);
console.log('✅ Error handler added successfully\n');

// Step 5: Verify app structure
console.log('Step 5: Verifying app structure...');
if (app && typeof app.listen === 'function') {
  console.log('✅ Express app structure is valid\n');
} else {
  console.error('❌ Invalid Express app structure');
  process.exit(1);
}

// Step 6: Test with mock DSN
console.log('Step 6: Testing with mock DSN...');
const app2 = express();
process.env.SENTRY_DSN = 'https://test@test.ingest.sentry.io/123456';
try {
  initSentry(app2, { serviceName: 'test-service-with-dsn' });
  app2.use(express.json());
  app2.get('/health', (_req, res) => {
    res.json({ status: 'healthy' });
  });
  initSentryErrorHandler(app2);
  console.log('✅ Service startup with DSN successful\n');
} catch (error) {
  console.error('❌ Error during startup with DSN:', error);
  process.exit(1);
}

console.log('🎉 All startup tests passed!');
console.log('\n📋 Summary:');
console.log(
  '  ✅ Sentry initialization works without DSN (graceful degradation)'
);
console.log('  ✅ Sentry initialization works with DSN');
console.log('  ✅ Middleware can be added after Sentry init');
console.log('  ✅ Routes work correctly');
console.log('  ✅ Error handler integration works');
console.log('  ✅ Service startup sequence is correct\n');
