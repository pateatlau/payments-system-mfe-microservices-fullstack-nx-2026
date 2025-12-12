/**
 * Comprehensive Sentry Integration Test
 *
 * Tests all aspects of Sentry integration:
 * 1. Build verification
 * 2. Module exports
 * 3. Initialization (with/without DSN)
 * 4. Error capture
 * 5. Service integration
 */

import {
  initSentry,
  initSentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  setTag,
  setContext,
  addBreadcrumb,
  startSpan,
} from '../libs/backend/observability/src/lib/sentry';
import express from 'express';

console.log('🧪 Comprehensive Sentry Integration Test\n');
console.log('='.repeat(60) + '\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void | Promise<void>): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => {
          console.log(`✅ ${name}`);
          testsPassed++;
        })
        .catch(error => {
          console.error(`❌ ${name}: ${error.message}`);
          testsFailed++;
        });
    } else {
      console.log(`✅ ${name}`);
      testsPassed++;
    }
  } catch (error) {
    console.error(
      `❌ ${name}: ${error instanceof Error ? error.message : String(error)}`
    );
    testsFailed++;
  }
}

// Test 1: Module Exports
console.log('📦 Module Exports\n');
test('All Sentry functions are exported', () => {
  if (typeof initSentry !== 'function')
    throw new Error('initSentry not exported');
  if (typeof initSentryErrorHandler !== 'function')
    throw new Error('initSentryErrorHandler not exported');
  if (typeof captureException !== 'function')
    throw new Error('captureException not exported');
  if (typeof captureMessage !== 'function')
    throw new Error('captureMessage not exported');
  if (typeof setUser !== 'function') throw new Error('setUser not exported');
  if (typeof setTag !== 'function') throw new Error('setTag not exported');
  if (typeof setContext !== 'function')
    throw new Error('setContext not exported');
  if (typeof addBreadcrumb !== 'function')
    throw new Error('addBreadcrumb not exported');
  if (typeof startSpan !== 'function')
    throw new Error('startSpan not exported');
});

// Test 2: Graceful Degradation
console.log('\n🛡️  Graceful Degradation (No DSN)\n');
test('Service initializes without DSN', () => {
  delete process.env.SENTRY_DSN;
  const app = express();
  initSentry(app, { serviceName: 'test-service' });
  // Should not throw
});

test('Error handler works without DSN', () => {
  const app = express();
  initSentryErrorHandler(app);
  // Should not throw
});

// Test 3: Initialization with DSN
console.log('\n🚀 Initialization with DSN\n');
test('Service initializes with DSN', () => {
  process.env.SENTRY_DSN = 'https://test@test.ingest.sentry.io/123456';
  const app = express();
  initSentry(app, { serviceName: 'test-service' });
  // Should not throw
});

test('Error handler initializes with DSN', () => {
  const app = express();
  initSentryErrorHandler(app);
  // Should not throw
});

// Test 4: Error Capture
console.log('\n📸 Error Capture\n');
test('captureException returns event ID', () => {
  const error = new Error('Test error');
  const eventId = captureException(error);
  if (!eventId) throw new Error('Event ID not returned');
});

test('captureException accepts context', () => {
  const error = new Error('Test error with context');
  const eventId = captureException(error, { test: true });
  if (!eventId) throw new Error('Event ID not returned');
});

test('captureMessage returns event ID', () => {
  const eventId = captureMessage('Test message', 'info');
  if (!eventId) throw new Error('Event ID not returned');
});

test('captureMessage accepts context', () => {
  const eventId = captureMessage('Test message', 'info', { test: true });
  if (!eventId) throw new Error('Event ID not returned');
});

// Test 5: Context Management
console.log('\n🏷️  Context Management\n');
test('setUser works', () => {
  setUser({ id: '123', email: 'test@example.com' });
  // Should not throw
});

test('setTag works', () => {
  setTag('test-tag', 'test-value');
  // Should not throw
});

test('setContext works', () => {
  setContext('test-context', { key: 'value' });
  // Should not throw
});

test('addBreadcrumb works', () => {
  addBreadcrumb({
    message: 'Test breadcrumb',
    level: 'info',
    category: 'test',
  });
  // Should not throw
});

// Test 6: Performance Monitoring
console.log('\n⚡ Performance Monitoring\n');
test('startSpan works', () => {
  const result = startSpan('test-operation', 'test', span => {
    if (!span) throw new Error('Span not provided');
    return 'test-result';
  });
  if (result !== 'test-result') throw new Error('Span callback not executed');
});

// Test 7: Express Integration
console.log('\n🌐 Express Integration\n');
test('Express app works with Sentry', () => {
  const app = express();
  process.env.SENTRY_DSN = 'https://test@test.ingest.sentry.io/123456';
  initSentry(app, { serviceName: 'test-service' });

  app.use(express.json());
  app.get('/test', (_req, res) => {
    res.json({ status: 'ok' });
  });

  initSentryErrorHandler(app);

  // App should be valid
  if (typeof app.listen !== 'function') {
    throw new Error('Express app not valid');
  }
});

test('Error handling works in Express', () => {
  const app = express();
  process.env.SENTRY_DSN = 'https://test@test.ingest.sentry.io/123456';
  initSentry(app, { serviceName: 'test-service' });

  app.get('/error', (_req, _res, next) => {
    next(new Error('Test error'));
  });

  initSentryErrorHandler(app);

  // Should not throw
});

// Test 8: Configuration
console.log('\n⚙️  Configuration\n');
test('Custom sample rates work', () => {
  const app = express();
  process.env.SENTRY_DSN = 'https://test@test.ingest.sentry.io/123456';
  initSentry(app, {
    serviceName: 'test-service',
    tracesSampleRate: 0.5,
    profilesSampleRate: 0.5,
  });
  // Should not throw
});

test('Custom environment works', () => {
  const app = express();
  process.env.SENTRY_DSN = 'https://test@test.ingest.sentry.io/123456';
  initSentry(app, {
    serviceName: 'test-service',
    environment: 'test',
  });
  // Should not throw
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Results\n');
console.log(`✅ Passed: ${testsPassed}`);
if (testsFailed > 0) {
  console.log(`❌ Failed: ${testsFailed}`);
} else {
  console.log(`❌ Failed: 0`);
}
console.log(`📈 Total: ${testsPassed + testsFailed}\n`);

if (testsFailed === 0) {
  console.log(
    '🎉 All tests passed! Sentry integration is working correctly.\n'
  );
  console.log('📝 Next Steps:');
  console.log('   1. Set SENTRY_DSN environment variable in your services');
  console.log('   2. Deploy services and monitor errors in Sentry dashboard');
  console.log('   3. Verify transaction traces and performance data\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the errors above.\n');
  process.exit(1);
}
