import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import { errorHandler } from "./src/middlewares/errorMiddleware.js";
import { initKafkaProducer, publishEvent, closeKafkaConnections } from "./src/events/kafka.js";
import { TOPICS, EVENT_TYPES } from "./src/events/eventTypes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to database
connectDB();

// Initialize Kafka producer
initKafkaProducer().catch(console.error);

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

// Auth specific rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: "Too many authentication attempts, please try again later."
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'auth-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found in auth service`
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);

  // Publish service started event
  try {
    await publishEvent(TOPICS.SYSTEM_EVENTS, EVENT_TYPES.SERVICE_STARTED, {
      serviceName: 'auth-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: PORT
    });
  } catch (error) {
    console.error('Failed to publish service started event:', error);
  }
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
