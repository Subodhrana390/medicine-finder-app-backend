import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./src/config/db.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import { errorHandler } from "./src/middlewares/errorMiddleware.js";
import { initKafkaProducer, subscribeToTopic, closeKafkaConnections } from "./src/events/kafka.js";
import { TOPICS } from "./src/events/eventTypes.js";
import { handleNotificationEvents } from "./src/events/notificationEventHandlers.js";
import { initializeNotificationService } from "./src/utils/templateSeeder.js";
import { initEmailServices } from "./src/services/emailService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'notification-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/notifications', notificationRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found in notification service`
  });
});

// Initialize services
async function initializeServices() {
  try {
    // Initialize email service
    initEmailServices();

    // Initialize Kafka producer
    await initKafkaProducer();

    // Subscribe to notification events
    await subscribeToTopic(TOPICS.USER_EVENTS, handleNotificationEvents);
    await subscribeToTopic(TOPICS.AUTH_EVENTS, handleNotificationEvents);
    await subscribeToTopic(TOPICS.SYSTEM_EVENTS, handleNotificationEvents);

    // Initialize notification templates
    await initializeNotificationService();

    console.log('📡 Notification service fully initialized');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);

  // Initialize Kafka and event subscriptions
  await initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeKafkaConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await closeKafkaConnections();
  process.exit(0);
});
