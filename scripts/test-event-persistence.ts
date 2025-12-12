#!/usr/bin/env tsx
/**
 * RabbitMQ Message Persistence Test
 *
 * Purpose: Test message persistence across broker restart
 * 
 * Usage:
 *   Step 1: pnpm tsx scripts/test-event-persistence.ts publish
 *   Step 2: docker-compose restart rabbitmq (manual step)
 *   Step 3: pnpm tsx scripts/test-event-persistence.ts verify
 */

import {
  RabbitMQConnectionManager,
  RabbitMQPublisher,
  RabbitMQSubscriber,
  BaseEvent,
  EventContext,
} from '@payments-system/rabbitmq-event-hub';
import { setTimeout as sleep } from 'timers/promises';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
const EXCHANGE_NAME = 'events';
const TEST_QUEUE = 'persistence.test.queue';
const STATE_FILE = join(__dirname, '../.test-persistence-state.json');

interface TestState {
  messageIds: string[];
  publishedAt: string;
}

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function createConnectionManager(): Promise<RabbitMQConnectionManager> {
  const manager = new RabbitMQConnectionManager({
    url: RABBITMQ_URL,
    heartbeat: 60,
    reconnection: {
      enabled: true,
      maxRetries: 10,
      initialDelay: 1000,
      maxDelay: 5000,
      multiplier: 2,
    },
  });

  await manager.connect();
  return manager;
}

async function publishMessages(): Promise<void> {
  log('='.repeat(80));
  log('STEP 1: Publishing Persistent Messages');
  log('='.repeat(80));

  const manager = await createConnectionManager();
  const publisher = new RabbitMQPublisher(manager, {
    exchange: EXCHANGE_NAME,
    exchangeType: 'topic',
    durable: true,
  });
  await publisher.initialize();

  const messageIds: string[] = [];
  const messageCount = 10;

  log(`Publishing ${messageCount} persistent messages...`);
  for (let i = 0; i < messageCount; i++) {
    const messageId = `persist-${Date.now()}-${i}`;
    await publisher.publish('test.persistence', {
      messageId,
      index: i,
      timestamp: Date.now(),
    });
    messageIds.push(messageId);
    log(`✓ Published message ${i + 1}/${messageCount}: ${messageId}`);
  }

  // Save state
  const state: TestState = {
    messageIds,
    publishedAt: new Date().toISOString(),
  };
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  log(`\n✓ Saved test state to: ${STATE_FILE}`);

  await manager.close();

  log('\n' + '='.repeat(80));
  log('NEXT STEP: Restart RabbitMQ broker');
  log('='.repeat(80));
  log('Run the following command in a separate terminal:');
  log('  docker-compose restart rabbitmq\n');
  log('Wait for RabbitMQ to fully restart (30 seconds), then run:');
  log('  pnpm tsx scripts/test-event-persistence.ts verify');
  log('='.repeat(80));
}

async function verifyMessages(): Promise<void> {
  log('='.repeat(80));
  log('STEP 3: Verifying Messages After Restart');
  log('='.repeat(80));

  // Load state
  if (!existsSync(STATE_FILE)) {
    console.error('❌ Error: Test state file not found. Run "publish" step first.');
    process.exit(1);
  }

  const state: TestState = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  log(`Published at: ${state.publishedAt}`);
  log(`Expected messages: ${state.messageIds.length}`);

  const manager = await createConnectionManager();
  const subscriber = new RabbitMQSubscriber(manager, {
    exchange: EXCHANGE_NAME,
    queue: TEST_QUEUE,
    routingKeyPattern: 'test.persistence',
    manualAck: true,
    durable: true,
  });
  await subscriber.initialize();

  const receivedIds: string[] = [];
  let subscriptionActive = true;

  log('\nWaiting for messages...');
  await subscriber.subscribe(async (event: BaseEvent, context: EventContext) => {
    const data = event.data as { messageId: string; index: number };
    receivedIds.push(data.messageId);
    log(`✓ Received message ${receivedIds.length}/${state.messageIds.length}: ${data.messageId} (index: ${data.index})`);
    context.ack();

    if (receivedIds.length === state.messageIds.length) {
      subscriptionActive = false;
    }
  });

  // Wait up to 15 seconds for all messages
  const timeout = Date.now() + 15000;
  while (subscriptionActive && Date.now() < timeout) {
    await sleep(100);
  }

  await manager.close();

  // Results
  log('\n' + '='.repeat(80));
  log('TEST RESULTS');
  log('='.repeat(80));
  log(`Published: ${state.messageIds.length}`);
  log(`Received:  ${receivedIds.length}`);

  const allReceived = receivedIds.length === state.messageIds.length;
  const missingIds = state.messageIds.filter((id) => !receivedIds.includes(id));

  if (allReceived) {
    log('\n✅ SUCCESS: All messages persisted across broker restart');
  } else {
    log('\n❌ FAILURE: Some messages were lost');
    log(`Missing ${missingIds.length} messages:`);
    missingIds.forEach((id) => log(`  - ${id}`));
  }

  log('='.repeat(80));

  process.exit(allReceived ? 0 : 1);
}

async function main(): Promise<void> {
  const command = process.argv[2];

  if (command === 'publish') {
    await publishMessages();
  } else if (command === 'verify') {
    await verifyMessages();
  } else {
    console.error('Usage: pnpm tsx scripts/test-event-persistence.ts [publish|verify]');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
