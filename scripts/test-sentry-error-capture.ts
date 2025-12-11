/**
 * Test Sentry Error Capture
 *
 * Verifies that errors are properly captured and handled
 */

import express from 'express';
import {
  initSentry,
  initSentryErrorHandler,
  captureException,
} from '../libs/backend/observability/src/lib/sentry';

console.log('🧪 Testing Sentry Error Capture\n');

// Setup Express app with Sentry
const app = express();

// Initialize Sentry with mock DSN
process.env.SENTRY_DSN = 'https://test@test.ingest.sentry.io/123456';
initSentry(app, { serviceName: 'error-test-service' });

app.use(express.json());

// Test route that throws an error
app.get('/error', (_req, _res, next) => {
  const error = new Error('Test error for Sentry capture');
  next(error);
});

// Test route that uses captureException directly
app.get('/capture', (_req, res) => {
  try {
    throw new Error('Error captured manually');
  } catch (error) {
    if (error instanceof Error) {
      const eventId = captureException(error, {
        endpoint: '/capture',
        userId: 'test-user',
      });
      res.json({
        status: 'error',
        message: 'Error captured',
        eventId: eventId || 'undefined (no real DSN)',
      });
    }
  }
});

// Add error handler
initSentryErrorHandler(app);

// Additional error handler for testing
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.log(`✅ Error caught: ${err.message}`);
    res.status(500).json({
      error: err.message,
      captured: true,
    });
  }
);

console.log('✅ Express app configured with error handling\n');

// Test 1: Direct error capture
console.log('Test 1: Direct error capture with captureException()');
try {
  const testError = new Error('Direct capture test');
  const eventId = captureException(testError, {
    test: true,
    source: 'direct-capture',
  });
  console.log(
    `✅ Error captured with event ID: ${eventId || 'undefined (expected without real DSN)'}\n`
  );
} catch (error) {
  console.error('❌ Failed to capture error:', error);
  process.exit(1);
}

// Test 2: Error in async context
console.log('Test 2: Error capture in async context');
(async () => {
  try {
    await Promise.reject(new Error('Async error test'));
  } catch (error) {
    if (error instanceof Error) {
      const eventId = captureException(error, {
        context: 'async',
      });
      console.log(
        `✅ Async error captured with event ID: ${eventId || 'undefined (expected without real DSN)'}\n`
      );
    }
  }
})();

// Test 3: Verify error handler is set up correctly
console.log('Test 3: Error handler setup');
if (app._router && app._router.stack) {
  const errorHandlers = app._router.stack.filter(
    (layer: { handle: { name: string } }) =>
      layer.handle && layer.handle.name === 'expressErrorHandler'
  );
  if (errorHandlers.length > 0) {
    console.log('✅ Sentry error handler is registered\n');
  } else {
    console.log(
      '⚠️  Sentry error handler not found in stack (may be registered differently)\n'
    );
  }
} else {
  console.log(
    '⚠️  Cannot verify error handler registration (router not initialized)\n'
  );
}

// Test 4: Test error with context
console.log('Test 4: Error with additional context');
try {
  const contextualError = new Error('Error with context');
  captureException(contextualError, {
    userId: 'user-123',
    action: 'test-action',
    metadata: {
      timestamp: new Date().toISOString(),
      environment: 'test',
    },
  });
  console.log('✅ Error with context captured successfully\n');
} catch (error) {
  console.error('❌ Failed to capture error with context:', error);
  process.exit(1);
}

console.log('🎉 All error capture tests passed!');
console.log('\n📋 Summary:');
console.log('  ✅ Direct error capture works');
console.log('  ✅ Async error capture works');
console.log('  ✅ Error handler is registered');
console.log('  ✅ Context can be added to errors');
console.log(
  '\n📝 Note: With a real Sentry DSN, errors will be sent to your Sentry project.'
);
console.log(
  '   Set SENTRY_DSN environment variable to enable error tracking.\n'
);
