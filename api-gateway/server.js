import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      user: process.env.USER_SERVICE_URL,
      notification: process.env.NOTIFICATION_SERVICE_URL,
      medicalShop: process.env.MEDICAL_SHOP_SERVICE_URL,
    }
  });
});

app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onError: (err, req, res) => {
    console.error('Auth service proxy error:', err.message);
    res.status(503).json({
      success: false,
      message: 'Auth service is currently unavailable'
    });
  }
}));

app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  },
  onError: (err, req, res) => {
    console.error('User service proxy error:', err.message);
    res.status(503).json({
      success: false,
      message: 'User service is currently unavailable'
    });
  }
}));

app.use('/api/notifications', createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/api/notifications'
  },
  onError: (err, req, res) => {
    console.error('Notification service proxy error:', err.message);
    res.status(503).json({
      success: false,
      message: 'Notification service is currently unavailable'
    });
  }
}));

app.use('/api/shops', createProxyMiddleware({
  target: process.env.MEDICAL_SHOP_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/shops': '/api/shops'
  },
  onError: (err, req, res) => {
    console.error('Medical shop service proxy error:', err.message);
    res.status(503).json({
      success: false,
      message: 'Medical shop service is currently unavailable'
    });
  }
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found in API Gateway`
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("API Gateway Error:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Routing to microservices:`);
  console.log(`   Auth: ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}`);
  console.log(`   User: ${process.env.USER_SERVICE_URL || 'http://localhost:3002'}`);
  console.log(`   Notification: ${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003'}`);
  console.log(`   Medical Shop: ${process.env.MEDICAL_SHOP_SERVICE_URL || 'http://localhost:3004'}`);
});
