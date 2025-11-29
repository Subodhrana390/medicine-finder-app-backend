# User Service

User management microservice for MedicineFinder application.

## Features

- User profile management
- User preferences and settings
- Avatar upload and management
- Extended user profiles
- Admin user management
- Cross-service communication with auth service

## API Endpoints

### User Profile Endpoints
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `POST /api/users/avatar` - Upload user avatar
- `DELETE /api/users/avatar` - Delete user avatar
- `PUT /api/users/deactivate` - Deactivate user account

### Preferences Endpoints
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update user preferences

### Extended Profile Endpoints
- `GET /api/users/extended-profile` - Get extended user profile
- `PUT /api/users/extended-profile` - Update extended user profile

### Admin Endpoints
- `GET /api/users/admin/stats` - Get user statistics
- `GET /api/users/admin/users` - Get all users (paginated)
- `GET /api/users/admin/users/:userId` - Get user by ID
- `PUT /api/users/admin/users/:userId` - Update user
- `DELETE /api/users/admin/users/:userId` - Delete user
- `PUT /api/users/admin/users/:userId/reactivate` - Reactivate user account

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3002

# Database Configuration
MONGO_URI=mongodb://localhost:27017/medicinefinder

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
INTERNAL_API_KEY=internal-service-key
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the service:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Docker

Build and run with Docker:
```bash
docker-compose up --build
```

## Models

### UserPreferences
- Notification preferences
- Language and timezone settings
- Theme preferences
- Privacy settings

### UserProfile
- Personal information (date of birth, gender)
- Contact information
- Address management
- Emergency contacts
- Professional information
- Medical information
- Social links
- Verification documents

## File Upload

The service supports avatar uploads with the following features:
- File size limit: 5MB (configurable)
- Supported formats: JPEG, PNG, GIF, WebP
- Automatic resizing and optimization
- Secure file naming

## Cross-Service Communication

The user service communicates with the auth service for:
- Retrieving user authentication data
- Updating user profile information
- Managing user account status

## Event Streaming with Kafka

The user service integrates with Apache Kafka for event-driven communication with other microservices.

### Event Topics
- `user-events` - User-related events (registration, login, updates, etc.)
- `auth-events` - Authentication events (token refresh, password reset, etc.)
- `system-events` - System events (service startup, health checks, etc.)

### Published Events
The user service publishes the following events:
- `system.service_started` - When the service starts up

### Consumed Events
The user service listens for and processes these events:
- `user.registered` - Creates default user preferences and profile
- `user.updated` - Updates user profile information
- `user.deleted` - Cleans up user data
- `user.login` - Updates login statistics
- `user.logout` - Logs session termination
- `user.password_changed` - Security event logging

### Event Schema
All events follow a consistent schema:
```json
{
  "id": "uuid",
  "type": "event.type",
  "timestamp": "ISO-8601",
  "service": "service-name",
  "version": "1.0",
  "data": { /* event-specific data */ },
  "metadata": {
    "correlationId": "uuid",
    "userId": "optional-user-id",
    "sessionId": "optional-session-id"
  }
}
```

## Security

- JWT token authentication required for all endpoints
- Role-based access control (user, shop-owner, admin, rider)
- File upload validation and sanitization
- Rate limiting and CORS protection
- Event data validation and sanitization
