import dotenv from 'dotenv';
import { publishEvent, subscribeToTopic, initKafkaProducer, closeKafkaConnections } from './src/events/kafka.js';
import { TOPICS, EVENT_TYPES } from './src/events/eventTypes.js';

dotenv.config();

// Test event handler
const testEventHandler = async (event, messageInfo) => {
  console.log('📥 Received test event:', {
    type: event.type,
    data: event.data,
    metadata: event.metadata,
    messageInfo
  });
};

async function testKafka() {
  console.log('🧪 Testing Kafka event streaming...\n');

  try {
    // Initialize producer
    console.log('1. Initializing Kafka producer...');
    await initKafkaProducer();
    console.log('✅ Producer initialized\n');

    // Test publishing an event
    console.log('2. Publishing test event...');
    const testEvent = await publishEvent(
      TOPICS.USER_EVENTS,
      EVENT_TYPES.USER_REGISTERED,
      {
        userId: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        provider: 'local',
        role: 'user',
        isActive: true
      },
      {
        correlationId: 'test-correlation-123',
        userId: 'test-user-123'
      }
    );
    console.log('✅ Event published:', testEvent.id);
    console.log('   Event data:', JSON.stringify(testEvent.data, null, 2) + '\n');

    // Test subscribing to events
    console.log('3. Subscribing to events...');
    await subscribeToTopic(TOPICS.USER_EVENTS, testEventHandler, 'test-group');

    // Publish another event to test subscription
    console.log('4. Publishing another test event...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for subscription

    await publishEvent(
      TOPICS.USER_EVENTS,
      EVENT_TYPES.USER_LOGIN,
      {
        userId: 'test-user-123',
        method: 'email',
        device: 'desktop',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
        sessionId: 'test-session-456'
      },
      {
        correlationId: 'test-correlation-456',
        userId: 'test-user-123',
        sessionId: 'test-session-456'
      }
    );

    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n✅ Kafka event streaming test completed successfully!');
    console.log('📊 Events were published and consumed correctly.');

  } catch (error) {
    console.error('❌ Kafka test failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    await closeKafkaConnections();
    process.exit(0);
  }
}

// Run the test
testKafka();
