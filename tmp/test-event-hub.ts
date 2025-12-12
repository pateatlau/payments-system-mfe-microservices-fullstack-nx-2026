import { EventPublisher, EventSubscriber } from 'event-hub';

async function testEventHub() {
  console.log('🧪 Testing Event Hub Library...\n');

  try {
    const publisher = new EventPublisher();
    const subscriber = new EventSubscriber();

    let eventReceived = false;
    let receivedData: any = null;

    // Subscribe to test event
    const subscription = await subscriber.subscribe('test:event', (event) => {
      console.log('✅ Event received:', event.type);
      receivedData = event.data;
      eventReceived = true;
    });

    console.log('📡 Subscribed to "test:event"');

    // Wait a moment for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 200));

    // Publish test event
    await publisher.publish('test:event', { 
      message: 'Hello from Event Hub!',
      timestamp: new Date().toISOString()
    }, 'test-service');

    console.log('📤 Published "test:event"');

    // Wait for event to be received
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (eventReceived && receivedData?.message === 'Hello from Event Hub!') {
      console.log('✅ Event Hub test passed!');
      console.log('   Data received:', JSON.stringify(receivedData, null, 2));
    } else {
      console.log('❌ Event Hub test failed - event not received');
      process.exit(1);
    }

    // Cleanup
    subscription.unsubscribe();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('\n🎉 Event Hub library verified!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testEventHub();
