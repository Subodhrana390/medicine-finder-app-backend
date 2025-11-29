import { Kafka } from 'kafkajs';
import { randomUUID } from 'crypto';

// Initialize Kafka client
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'user-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Producers and Consumers
let producer = null;
let consumer = null;

/**
 * Initialize Kafka producer
 */
export const initKafkaProducer = async () => {
  try {
    if (!producer) {
      producer = kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000
      });
      await producer.connect();
      console.log('📤 Kafka producer connected');
    }
    return producer;
  } catch (error) {
    console.error('❌ Failed to initialize Kafka producer:', error);
    throw error;
  }
};

/**
 * Initialize Kafka consumer
 */
export const initKafkaConsumer = async (groupId) => {
  try {
    if (!consumer) {
      consumer = kafka.consumer({
        groupId: groupId || process.env.KAFKA_GROUP_ID || 'user-service-group',
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        rebalanceTimeout: 60000
      });
      await consumer.connect();
      console.log('📥 Kafka consumer connected');
    }
    return consumer;
  } catch (error) {
    console.error('❌ Failed to initialize Kafka consumer:', error);
    throw error;
  }
};

/**
 * Publish event to Kafka topic
 */
export const publishEvent = async (topic, eventType, data, metadata = {}) => {
  try {
    if (!producer) {
      await initKafkaProducer();
    }

    const event = {
      id: randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      service: process.env.KAFKA_CLIENT_ID || 'user-service',
      version: '1.0',
      data,
      metadata: {
        correlationId: metadata.correlationId || randomUUID(),
        userId: metadata.userId,
        sessionId: metadata.sessionId,
        ...metadata
      }
    };

    await producer.send({
      topic,
      messages: [
        {
          key: event.data.userId || event.id, // Use userId as key for user events
          value: JSON.stringify(event),
          headers: {
            'event-type': eventType,
            'service': event.service,
            'version': event.version
          }
        }
      ]
    });

    console.log(`📤 Event published: ${eventType} to topic: ${topic}`);
    return event;
  } catch (error) {
    console.error('❌ Failed to publish event:', error);
    throw error;
  }
};

/**
 * Subscribe to Kafka topic
 */
export const subscribeToTopic = async (topic, handler, groupId = null) => {
  try {
    if (!consumer) {
      await initKafkaConsumer(groupId);
    }

    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          const headers = message.headers || {};

          console.log(`📥 Event received: ${event.type} from topic: ${topic}`);

          await handler(event, {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            headers
          });
        } catch (error) {
          console.error('❌ Error processing message:', error);
          // In production, you might want to send to dead letter queue
        }
      }
    });

    console.log(`📥 Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error('❌ Failed to subscribe to topic:', error);
    throw error;
  }
};

/**
 * Close Kafka connections
 */
export const closeKafkaConnections = async () => {
  try {
    if (producer) {
      await producer.disconnect();
      console.log('📤 Kafka producer disconnected');
    }
    if (consumer) {
      await consumer.disconnect();
      console.log('📥 Kafka consumer disconnected');
    }
  } catch (error) {
    console.error('❌ Error closing Kafka connections:', error);
  }
};

/**
 * Health check for Kafka
 */
export const checkKafkaHealth = async () => {
  try {
    if (!producer) {
      await initKafkaProducer();
    }

    // Try to get cluster info
    const clusterInfo = await producer.describeCluster();
    return {
      status: 'healthy',
      brokers: clusterInfo.brokers.length,
      controller: clusterInfo.controller
    };
  } catch (error) {
    console.error('❌ Kafka health check failed:', error);
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};
