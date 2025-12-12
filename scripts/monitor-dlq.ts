#!/usr/bin/env tsx
/**
 * RabbitMQ Dead Letter Queue Monitor
 *
 * Purpose: Monitor and inspect messages in the Dead Letter Queue
 * 
 * Usage:
 *   pnpm tsx scripts/monitor-dlq.ts
 */

import {
  RabbitMQConnectionManager,
  RabbitMQSubscriber,
  BaseEvent,
  EventContext,
} from '@payments-system/rabbitmq-event-hub';
import { setTimeout as sleep } from 'timers/promises';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
const DLQ_NAME = 'events.dlq';

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function createConnectionManager(): Promise<RabbitMQConnectionManager> {
  const manager = new RabbitMQConnectionManager({
    url: RABBITMQ_URL,
    heartbeat: 60,
    reconnection: {
      enabled: true,
      maxRetries: 5,
      initialDelay: 1000,
      maxDelay: 5000,
      multiplier: 2,
    },
  });

  await manager.connect();
  return manager;
}

async function monitorDLQ(): Promise<void> {
  log('='.repeat(80));
  log('Dead Letter Queue Monitor');
  log('='.repeat(80));
  log(`Monitoring queue: ${DLQ_NAME}`);
  log('Press Ctrl+C to exit\n');

  const manager = await createConnectionManager();
  
  // Note: DLQ doesn't have an exchange binding in the same way as regular queues
  // We'll create a direct subscriber to the DLQ
  const subscriber = new RabbitMQSubscriber(manager, {
    queue: DLQ_NAME,
    manualAck: true,
    durable: true,
  });
  
  await subscriber.initialize();

  let messageCount = 0;

  await subscriber.subscribe(async (event: BaseEvent, context: EventContext) => {
    messageCount++;
    log('\n' + '-'.repeat(80));
    log(`Message #${messageCount}`);
    log('-'.repeat(80));
    log(`Event Type: ${event.eventType}`);
    log(`Event ID: ${event.eventId}`);
    log(`Timestamp: ${new Date(event.timestamp).toISOString()}`);
    log(`Service: ${event.metadata?.service || 'unknown'}`);
    log(`User ID: ${event.metadata?.userId || 'N/A'}`);
    log(`Data: ${JSON.stringify(event.data, null, 2)}`);
    log('-'.repeat(80));

    // Acknowledge the DLQ message (removes it from queue)
    context.ack();
  });

  log('Waiting for messages in DLQ...');
  log('(If no messages appear, the DLQ might be empty)\n');

  // Keep running until interrupted
  while (true) {
    await sleep(1000);
  }
}

async function main(): Promise<void> {
  try {
    await monitorDLQ();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('\nShutting down monitor...');
  process.exit(0);
});

main();
