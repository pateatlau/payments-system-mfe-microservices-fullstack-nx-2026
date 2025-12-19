# ADR-0001: RabbitMQ for Production Event Hub

**Status:** Accepted  
**Date:** 2026-01-XX  
**Context:** Backend POC-3 - Event Hub Migration from Redis Pub/Sub  
**Decision Makers:** Backend Team

---

## Context

We need to migrate from Redis Pub/Sub (used in POC-2) to a production-ready event hub for POC-3. The POC-2 implementation validated the event-based architecture, but Redis Pub/Sub has limitations (no message persistence, no guaranteed delivery). POC-3 requires production-ready features: message persistence, guaranteed delivery, retry mechanisms, and dead letter queues.

**Requirements:**

- Message persistence (messages survive service restarts)
- Guaranteed delivery (no message loss)
- Retry mechanisms (automatic retry with exponential backoff)
- Dead letter queue (DLQ) for failed messages
- Event replay capability
- Production-ready and battle-tested
- Works well with Node.js
- Active maintenance

---

## Decision

We will migrate from **Redis Pub/Sub to RabbitMQ** for the event hub in POC-3.

**Rationale:**

- **Message Persistence** - Messages are persisted to disk, survive service restarts
- **Guaranteed Delivery** - Messages are acknowledged, no message loss
- **Retry Mechanisms** - Built-in retry with exponential backoff
- **Dead Letter Queue** - Failed messages after max retries go to DLQ
- **Production-Ready** - Used by major companies, battle-tested
- **Feature-Rich** - Exchanges, queues, bindings, routing patterns
- **Node.js Support** - Excellent Node.js libraries (amqplib)
- **Scalable** - Handles high message volumes

---

## Alternatives Considered

### 1. Apache Kafka

**Pros:**
- Enterprise-grade event streaming
- High throughput
- Event sourcing support
- Horizontal scaling
- Event replay from any point in time

**Cons:**
- Very complex setup and operation
- Requires Zookeeper/KRaft
- High operational overhead
- Steeper learning curve
- Overkill for POC-3 needs
- More suitable for event streaming at scale

**Decision:** Not chosen - Too complex for POC-3. Consider for MVP/Production if event streaming is needed.

---

### 2. AWS SQS / Google Pub/Sub

**Pros:**
- Managed service (no infrastructure to manage)
- Scalable
- Production-ready
- Pay-as-you-go

**Cons:**
- Vendor lock-in
- Additional cost
- Less control over configuration
- May not be suitable for on-premise deployment
- Network latency (if not in same region)

**Decision:** Not chosen - Vendor lock-in and cost concerns. RabbitMQ provides more control and flexibility.

---

### 3. Redis Streams

**Pros:**
- Already using Redis for caching
- Simpler than RabbitMQ
- Good performance
- Message persistence (unlike Pub/Sub)

**Cons:**
- Less feature-rich than RabbitMQ
- No built-in dead letter queue
- Less mature than RabbitMQ for message queuing
- Limited routing patterns

**Decision:** Not chosen - RabbitMQ provides more production-ready features (DLQ, retry mechanisms, routing patterns).

---

### 4. RabbitMQ (Chosen)

**Pros:**
- Message persistence
- Guaranteed delivery
- Retry mechanisms
- Dead letter queue
- Production-ready
- Feature-rich (exchanges, queues, bindings)
- Excellent Node.js support
- Scalable

**Cons:**
- More complex than Redis Pub/Sub
- Requires additional infrastructure
- Operational overhead

**Decision:** Chosen - Best balance of features, production-readiness, and complexity for POC-3.

---

## Trade-offs

### Pros

- ✅ **Message Persistence** - Messages survive service restarts
- ✅ **Guaranteed Delivery** - No message loss
- ✅ **Retry Mechanisms** - Automatic retry with exponential backoff
- ✅ **Dead Letter Queue** - Failed messages handled gracefully
- ✅ **Production-Ready** - Used by major companies
- ✅ **Feature-Rich** - Exchanges, queues, bindings, routing patterns
- ✅ **Scalable** - Handles high message volumes

### Cons

- ⚠️ **Complexity** - More complex than Redis Pub/Sub
- ⚠️ **Infrastructure** - Requires RabbitMQ server
- ⚠️ **Operational Overhead** - Need to manage RabbitMQ

---

## Consequences

### Positive

- ✅ **Reliability** - No message loss, guaranteed delivery
- ✅ **Production-Ready** - Suitable for production use
- ✅ **Scalability** - Handles high message volumes
- ✅ **Error Handling** - Dead letter queue for failed messages
- ✅ **Event Replay** - Can replay events if needed

### Negative

- ⚠️ **Complexity** - More complex setup and operation than Redis Pub/Sub
- ⚠️ **Infrastructure** - Additional infrastructure to manage
- ⚠️ **Operational Overhead** - Need to monitor and maintain RabbitMQ

### Neutral

- 🔄 **Migration Path** - Migration from Redis Pub/Sub is straightforward
- 🔄 **Performance** - Performance is excellent for POC-3 needs

---

## Implementation Notes

- Use RabbitMQ 3.x (latest stable)
- Use `amqplib` library for Node.js
- Implement exchanges, queues, bindings
- Setup dead letter queue
- Implement retry mechanisms
- Add event versioning
- Add event schema validation

**Example:**

```typescript
// packages/shared-event-hub/src/rabbitmq-publisher.ts
import amqp from 'amqplib';

export class RabbitMQPublisher {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect(): Promise<void> {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.connection.createChannel();
    
    // Setup dead letter queue
    await this.channel.assertExchange('dlx', 'direct', { durable: true });
    await this.channel.assertQueue('dlq', { durable: true });
    await this.channel.bindQueue('dlq', 'dlx', '');
  }

  async publish(exchange: string, routingKey: string, event: any): Promise<void> {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    
    const message = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
      version: '1.0',
    });

    this.channel.publish(exchange, routingKey, Buffer.from(message), {
      persistent: true,
      messageId: event.id,
      correlationId: event.correlationId,
    });
  }
}
```

---

## Migration Path

### POC-2 → POC-3

- Migrate from Redis Pub/Sub to RabbitMQ
- Update event publisher to use RabbitMQ
- Update event subscriber to use RabbitMQ
- Implement retry mechanisms
- Implement dead letter queue
- Add event versioning

**Reference:** See `docs/backend-event-hub-implementation-plan.md` for detailed migration plan.

### POC-3 → MVP/Production

- Continue with RabbitMQ
- Or migrate to Apache Kafka if event streaming is needed
- Decision based on scale and requirements

---

## Related Decisions

- **ADR-0004 (POC-2): Redis Pub/Sub for Event Hub** - POC-2 decision, migrating from in POC-3
- **ADR-0001 (POC-2): Use Express Framework** - Event hub is independent of Express
- Frontend Event Bus (independent decision)

---

## References

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [amqplib npm package](https://www.npmjs.com/package/amqplib)
- `docs/backend-event-hub-implementation-plan.md` - Event hub implementation plan
- `docs/backend-poc3-architecture.md` - POC-3 architecture documentation
- `docs/backend-poc3-tech-stack.md` - POC-3 tech stack documentation

---

**Last Updated:** 2026-01-XX

