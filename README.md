# MedicineFinder Backend

A scalable microservices-based backend for a medicine finder application, built with Node.js, Express, MongoDB, and Apache Kafka for event streaming.

## 🏗️ Architecture

This project follows a microservices architecture with event-driven communication:

┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐      ┌──────────────────────────┐
│    API Gateway    │──────│   Auth Service    │──────│   User Service    │──────│  Medical Shop Service    │
│     (3000)        │      │     (3001)        │      │      (3002)       │      │        (3004)            │
└───────────────────┘      └───────────────────┘      └───────────────────┘      └──────────────────────────┘
           │                         │                         │
           └─────────────────────────┼─────────────────────────┘
                                     │
                        ┌────────────────────────┐      ┌────────────────────────┐
                        │ Notification Service   │      │         Kafka           │
                        │       (3003)           │      │   (Event Streaming)    │
                        └────────────────────────┘      └────────────────────────┘
                                     │
                                     │
                        ┌────────────────────────┐
                        │        MongoDB          │
                        │       (Database)        │
                        └────────────────────────┘


## 🚀 Services Overview

### API Gateway
- **Port**: 3000
- **Purpose**: Single entry point for all client requests
- **Features**: Request routing, rate limiting, CORS, authentication middleware
- **Routes**: Proxies requests to appropriate microservices

### Auth Service
- **Port**: 3001
- **Purpose**: User authentication and authorization
- **Features**:
  - User registration/login (local, Google OAuth)
  - JWT token management
  - Password reset functionality
  - 2FA support
  - Session management
  - Audit logging

### User Service
- **Port**: 3002
- **Purpose**: User profile and preference management
- **Features**:
  - Extended user profiles
  - User preferences (notifications, language, theme)
  - Avatar upload and management
  - Address management
  - Emergency contacts
  - Professional information

### Notification Service
- **Port**: 3003
- **Purpose**: Multi-channel notification management
- **Features**:
  - Email notifications (SMTP/Brevo)
  - In-app notifications
  - Template-based messaging
  - User preference management
  - Event-driven notifications
  - Analytics and tracking

### Medical Shop Service
- **Port**: 3004
- **Purpose**: Medical shop, medicine catalog, and inventory management
- **Features**:
  - Medical shop onboarding with verification
  - Profile & document management
  - GPS/proximity-based shop discovery
  - Medicine catalog (batch/expiry, filter/search, prescription tracking)
  - Robust inventory & audit trail (stock, alerts)
  - REST & bulk endpoints
  - Geospatial queries
  - Event-driven via Kafka
- **Routes**: `/api/shops`, `/api/shops/medicines`, `/api/shops/inventory`, etc.

## 🛠️ Technology Stack

- **Runtime**: Node.js with ES6+ modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Message Broker**: Apache Kafka with Zookeeper
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod schemas
- **File Upload**: Multer with Sharp image processing
- **Security**: Helmet, CORS, rate limiting
- **Containerization**: Docker & Docker Compose
- **Process Management**: PM2 (production)

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB (handled by Docker)
- Apache Kafka (handled by Docker)

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MedicineFinderBackend
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Verify services are running**
   ```bash
   # API Gateway
   curl http://localhost:3000/health

   # Auth Service
   curl http://localhost:3001/health

   # User Service
   curl http://localhost:3002/health

   # Notification Service
   curl http://localhost:3003/health
   ```

### Local Development

1. **Install dependencies for all services**
   ```bash
   # API Gateway
   cd api-gateway && npm install

   # Auth Service
   cd ../services/auth-service && npm install

   # User Service
   cd ../user-service && npm install
   ```

2. **Start infrastructure services**
   ```bash
   docker-compose up mongodb kafka zookeeper
   ```

3. **Start services in separate terminals**
   ```bash
   # Terminal 1 - API Gateway
   cd api-gateway && npm run dev

   # Terminal 2 - Auth Service
   cd services/auth-service && npm run dev

   # Terminal 3 - User Service
   cd services/user-service && npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Create `.env` files in each service directory:

#### API Gateway (.env)
```env
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
```

#### Auth Service (.env)
```env
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://localhost:27017/medicinefinder
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id
WEB_CLIENT_ID=your-web-client-id
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=auth-service
KAFKA_GROUP_ID=auth-service-group
```

#### User Service (.env)
```env
NODE_ENV=development
PORT=3002
MONGO_URI=mongodb://localhost:27017/medicinefinder
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
AUTH_SERVICE_URL=http://localhost:3001
INTERNAL_API_KEY=internal-service-key
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=user-service
KAFKA_GROUP_ID=user-service-group
```

#### Medical Shop Service (.env)
```env
NODE_ENV=development
PORT=3004
MONGO_URI=mongodb://localhost:27017/medicinefinder
JWT_SECRET=your-super-secret-jwt-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=medical-shop-service
KAFKA_GROUP_ID=medical-shop-service-group
```

## 📡 API Documentation

### Authentication Endpoints

All requests require authentication except registration and login.

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <jwt-token>
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "John Updated",
  "mobile": "+919876543210"
}
```

#### Upload Avatar
```http
POST /api/users/avatar
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

avatar: <image-file>
```

#### Get Notifications
```http
GET /api/notifications
Authorization: Bearer <jwt-token>
Query Params: page, limit, category, isRead
```

#### Send Test Notification (Admin)
```http
POST /api/notifications/test
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "type": "email",
  "recipient": "user@example.com",
  "title": "Test Notification",
  "message": "This is a test notification"
}
```

### Response Format

All API responses follow this structure:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

## 📨 Event Streaming with Kafka

Services communicate asynchronously through Kafka events:

### Topics
- `user-events` - User lifecycle events
- `auth-events` - Authentication events
- `system-events` - Service health events

### Event Examples

#### User Registration Event
```json
{
  "id": "uuid",
  "type": "user.registered",
  "timestamp": "2024-01-01T10:00:00Z",
  "service": "auth-service",
  "version": "1.0",
  "data": {
    "userId": "user-123",
    "email": "john@example.com",
    "name": "John Doe",
    "provider": "local",
    "role": "user"
  },
  "metadata": {
    "correlationId": "correlation-123",
    "userId": "user-123"
  }
}
```

### Testing Event Streaming
```bash
cd services/user-service
npm run test:kafka
```

## 🔒 Security Features

- **JWT Authentication**: Stateless authentication with refresh tokens
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security**: Security headers and protections
- **Input Validation**: Zod schema validation for all inputs
- **File Upload Security**: Image validation and size limits
- **Password Security**: bcrypt hashing with salt rounds

## 📊 Database Schema

### User Collection (Auth Service)
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  mobile: String,
  provider: String,
  role: String,
  isActive: Boolean,
  lastLogin: Date,
  refreshTokens: [/* token array */]
}
```

### UserPreferences Collection (User Service)
```javascript
{
  userId: ObjectId,
  emailNotifications: Boolean,
  language: String,
  theme: String,
  timezone: String,
  locationSharing: Boolean
}
```

### UserProfile Collection (User Service)
```javascript
{
  userId: ObjectId,
  dateOfBirth: Date,
  gender: String,
  addresses: [/* address array */],
  emergencyContacts: [/* contact array */],
  socialLinks: Object,
  isVerified: Boolean
}
```

### MedicalShop Collection (Medical Shop Service)
```javascript
{
  name: String,
  ownerId: ObjectId, // Reference to User
  licenseNumber: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { latitude: Number, longitude: Number }
  },
  operatingHours: Object,
  services: [String],
  status: String,
  verificationStatus: String,
  ratings: { average: Number, count: Number }
}
```

### Medicine Collection (Medical Shop Service)
```javascript
{
  name: String,
  genericName: String,
  manufacturer: String,
  category: String,
  dosageForms: [{ form: String, strength: String, unit: String }],
  prescriptionRequired: Boolean,
  description: String,
  regulatoryInfo: {
    drugLicenseNumber: String,
    expiryDate: Date
  }
}
```

### Inventory Collection (Medical Shop Service)
```javascript
{
  shopId: ObjectId,
  medicineId: ObjectId,
  batchNumber: String,
  quantity: Number,
  availableQuantity: Number,
  pricing: {
    costPrice: Number,
    sellingPrice: Number,
    mrp: Number,
    discountPercentage: Number
  },
  expiryDate: Date,
  alerts: {
    lowStockThreshold: Number,
    expiryAlertDays: Number
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
# Run tests for each service
cd services/auth-service && npm test
cd services/user-service && npm test
```

### Integration Tests
```bash
# Test event streaming
cd services/user-service && npm run test:kafka

# API endpoint testing with tools like Postman or curl
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'
```

## 📈 Monitoring & Logging

- **Health Checks**: Each service exposes `/health` endpoint
- **Service Logs**: Docker logs for all services
- **Event Monitoring**: Kafka topic monitoring
- **Performance**: Built-in Express middleware logging

## 🚀 Deployment

### Production Environment

1. **Configure environment variables** with production values
2. **Use production Docker images**
3. **Set up reverse proxy** (nginx) for SSL termination
4. **Configure Kafka security** and authentication
5. **Set up monitoring** (ELK stack, Prometheus)
6. **Enable log aggregation** and alerting

### Docker Production Setup

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  # Production configuration with
  # - Environment-specific variables
  # - Resource limits
  # - Health checks
  # - Logging configuration
  # - Volume mounts for persistent data
```

## 🔧 Development

### Code Structure
```
MedicineFinderBackend/
├── api-gateway/           # API Gateway service
├── services/
│   ├── auth-service/      # Authentication service
│   └── user-service/      # User management service
├── docker-compose.yml     # Development environment
├── docker-compose.prod.yml # Production environment
└── README.md             # This file
```

### Adding New Services

1. Create service directory under `services/`
2. Implement standard structure (controllers, routes, models)
3. Add to docker-compose.yml
4. Update API Gateway routing
5. Configure Kafka event publishing/subscription

### Code Standards

- **ES6+ Modules**: Modern JavaScript with import/export
- **Async/Await**: For asynchronous operations
- **Error Handling**: Centralized error middleware
- **Validation**: Zod schemas for type safety
- **Documentation**: JSDoc comments for functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code structure and naming conventions
- Write tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR
- Use meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review service-specific README files

## 🗺️ Roadmap

- [x] Medicine catalog service
- [x] Pharmacy location service
- [x] Order management service
- [ ] Payment integration
- [ ] Real-time notifications
- [ ] Mobile app API
- [ ] Admin dashboard
- [ ] Analytics and reporting

---

**Built with ❤️ using Microservices Architecture**
