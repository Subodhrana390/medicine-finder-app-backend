# Auth Service

Authentication microservice for MedicineFinder providing comprehensive user authentication, authorization, and security features.

## 🚀 Features

- **User Registration & Login** - Email/password authentication
- **Google OAuth** - Social login integration
- **JWT Tokens** - Access and refresh token management
- **Two-Factor Authentication** - Email-based 2FA
- **Session Management** - Device tracking and session control
- **Password Management** - Forgot/reset/change password
- **Audit Logging** - Comprehensive security event logging
- **IP Geolocation** - Location tracking with caching
- **Rate Limiting** - Protection against brute force attacks

## 📋 Prerequisites

- Node.js 18+
- MongoDB
- Docker & Docker Compose (for containerized deployment)

## 🛠️ Setup

### 1. Install Dependencies
```bash
cd services/auth-service
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Brevo Email Setup (Required)
The service uses Brevo (formerly Sendinblue) for email delivery:

1. **Create Account**: Sign up at [brevo.com](https://brevo.com)
2. **Get API Key**: SMTP & API → API Keys → Create new key
3. **Verify Sender**: Senders → Add and verify your email/domain
4. **Configure Environment**:
   ```env
   BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxx
   BREVO_USER=noreply@yourdomain.com
   FRONTEND_URL=http://localhost:3000
   ```

### 4. Google OAuth Setup (Optional)
If using Google OAuth, you have two options:

#### Option A: Environment Variables (Recommended)
```env
GOOGLE_CLIENT_ID=your-google-client-id
WEB_CLIENT_ID=your-web-client-id
```

#### Option B: Client Secret File
1. Download `client_secret.json` from Google Cloud Console
2. Place it in `src/config/client_secret.json`
3. The service will automatically detect and use it

### 4. Firebase Setup (Optional)
If using Firebase features:

1. Download `service-account.json` from Firebase Console
2. Place it in `src/config/service-account.json`
3. The service will automatically initialize Firebase Admin SDK

## 🔧 Configuration

### Environment Variables (.env)

```env
# Service Configuration
NODE_ENV=production
PORT=3001

# Database
MONGO_URI=mongodb://localhost:27017/medicinefinder

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Google OAuth (Option A)
GOOGLE_CLIENT_ID=your-google-client-id
WEB_CLIENT_ID=your-web-client-id

# Email Configuration (Brevo/Sendinblue)
BREVO_API_KEY=your-brevo-api-key
BREVO_USER=your-verified-sender@yourdomain.com
FRONTEND_URL=http://localhost:3000

# Security
BCRYPT_ROUNDS=10
SESSION_TIMEOUT_DAYS=7
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Running the Service

### Development
```bash
npm run dev
```

### Production (Docker)
```bash
# From project root
docker-compose up -d auth-service
```

### Health Check
```bash
curl http://localhost:3001/health
```

## 📡 API Endpoints

### Authentication Routes
```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login
POST   /api/auth/google            - Google OAuth login
POST   /api/auth/refresh           - Refresh access token
POST   /api/auth/logout            - Logout current session
POST   /api/auth/logout/all        - Logout all sessions
POST   /api/auth/2fa/verify        - Verify 2FA code
POST   /api/auth/2fa/enable        - Enable 2FA
POST   /api/auth/2fa/disable       - Disable 2FA
GET    /api/auth/2fa/status        - Get 2FA status
GET    /api/auth/geolocation       - Get IP geolocation
```

### Password Management
```
POST   /api/auth/password/forgot   - Request password reset
POST   /api/auth/password/reset    - Reset password with token
POST   /api/auth/password/change   - Change password (authenticated)
```

## 🔐 Security Features

### Authentication
- **JWT Tokens** with refresh token rotation
- **Password Hashing** using bcrypt with configurable rounds
- **Session Management** with device fingerprinting
- **Two-Factor Authentication** via email

### Protection
- **Rate Limiting** on authentication endpoints
- **CORS Protection** with configurable origins
- **Helmet Security Headers**
- **Input Validation** with comprehensive Zod schemas

### Monitoring
- **Audit Logging** for all security events
- **IP Geolocation** tracking for fraud detection
- **Failed Login Tracking** for security analysis

## 🗂️ Project Structure

```
services/auth-service/
├── src/
│   ├── config/
│   │   ├── db.js                 # Database connection
│   │   ├── google.js             # Google OAuth configuration
│   │   ├── firebase.js           # Firebase Admin SDK (future)
│   │   ├── service-account.json  # Firebase credentials (sensitive)
│   │   └── client_secret.json    # Google OAuth credentials (sensitive)
│   ├── utils/
│   │   └── index.js              # Utility functions
│   ├── controllers/
│   │   └── authController.js     # Main authentication logic
│   ├── models/
│   │   ├── User.js               # User data model
│   │   └── AuditLog.js           # Audit logging model
│   ├── routes/
│   │   └── authRoutes.js         # API route definitions
│   ├── services/
│   │   └── auditService.js       # Audit logging service
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT authentication
│   │   ├── asyncHandler.js       # Async error handling
│   │   └── errorMiddleware.js    # Error response formatting
│   └── validators/
│       └── authValidator.js      # Input validation schemas
├── .env                          # Environment variables (not committed)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules for sensitive files
├── Dockerfile                    # Docker container configuration
├── package.json                  # Node.js dependencies
├── server.js                     # Express server setup
└── README.md                     # This file
```

## 🔒 Sensitive Files Management

### Google OAuth Credentials
- **Primary**: Use environment variables (`GOOGLE_CLIENT_ID`)
- **Fallback**: `src/config/client_secret.json` (mounted as Docker volume)
- **Security**: File is gitignored and mounted read-only

### Firebase Credentials
- **Location**: `src/config/service-account.json`
- **Usage**: Automatically loaded by Firebase Admin SDK
- **Security**: File is gitignored and mounted read-only

### Best Practices
1. **Never commit sensitive files** to version control
2. **Use environment variables** when possible
3. **Mount files as read-only volumes** in Docker
4. **Rotate credentials regularly**
5. **Use different credentials** for different environments

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📊 Monitoring & Logs

### Health Checks
```bash
# Service health
GET /health

# Detailed health info
GET /health?details=true
```

### Audit Logs
All authentication events are logged to MongoDB with:
- User ID and action type
- IP address and geolocation
- Device and user agent information
- Timestamp and success status

## 🔧 Development

### Adding New Features
1. Update models in `src/models/`
2. Add validation in `src/validators/`
3. Implement logic in `src/controllers/`
4. Add routes in `src/routes/`
5. Update audit logging if needed

### Utility Functions
Common utility functions are available in `src/utils/index.js`:

- `parseUserAgent(userAgent)` - Extract device type from user agent
- `getClientIP(req)` - Get client IP from request
- `generateSecureToken(length)` - Generate secure random token
- `hashToken(token)` - SHA-256 hash of token
- `isValidEmail(email)` - Email format validation
- `validatePassword(password)` - Password strength validation
- `generateTwoFactorCode()` - Generate 6-digit 2FA code
- `getTokenExpiration(hours)` - Calculate token expiration
- `isExpired(date)` - Check if date is expired

### Code Style
- Use ES6+ features
- Async/await for asynchronous operations
- Proper error handling with try/catch
- JSDoc comments for functions
- Zod schemas for validation

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run
docker-compose up -d

# Scale the service
docker-compose up -d --scale auth-service=3

# View logs
docker-compose logs auth-service
```

### Environment-Specific Deployment
```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.prod.yml up -d

# With monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB status
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

**Google OAuth Not Working**
- Verify `GOOGLE_CLIENT_ID` environment variable
- Check `client_secret.json` file exists and is valid
- Ensure Google Cloud Console credentials are correct

**Email Not Sending**
- Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`
- Check Gmail app password if using Gmail
- Review server logs for SMTP errors

### Logs and Debugging
```bash
# View service logs
docker-compose logs auth-service

# Follow logs in real-time
docker-compose logs -f auth-service

# View specific time range
docker-compose logs --since "1h" auth-service
```

## 📞 Support

- **Issues**: Create GitHub issues with detailed error logs
- **Security**: Report security issues privately
- **Documentation**: Update this README for new features

---

**Version**: 1.0.0
**Status**: ✅ Production Ready
**Last Updated**: November 2025
