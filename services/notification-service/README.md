# Notification Service

A comprehensive notification service for MedicineFinder that handles email and in-app notifications with event-driven architecture.

## Features

- **Multi-channel Notifications**: Email and In-app notifications
- **Event-Driven**: Kafka-based event processing for real-time notifications
- **Template System**: Handlebars-based templates with variable substitution
- **Preference Management**: User-controlled notification preferences
- **Analytics**: Notification delivery tracking and analytics
- **Admin Tools**: Template management and testing utilities

## Architecture

The notification service listens to Kafka events from other services and automatically sends appropriate notifications based on:

- User registration events
- Login/security events
- Password changes
- System notifications
- Custom business events

## API Endpoints

### User Endpoints

#### Get Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
Query Params: page, limit, category, isRead
```

#### Get Notification by ID
```http
GET /api/notifications/:id
Authorization: Bearer <token>
```

#### Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
PUT /api/notifications/mark-all-read
Authorization: Bearer <token>
Query Params: category
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

#### Get Notification Statistics
```http
GET /api/notifications/stats
Authorization: Bearer <token>
```

#### Get Preferences
```http
GET /api/notifications/preferences/manage
Authorization: Bearer <token>
```

#### Update Preferences
```http
PUT /api/notifications/preferences/manage
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": {
    "enabled": true,
    "categories": {
      "account": true,
      "security": true,
      "marketing": false
    }
  },
  "sms": {
    "enabled": false,
    "categories": {
      "account": false,
      "security": true
    }
  }
}
```

### Admin Endpoints (Require Admin Role)

#### Send Test Notification
```http
POST /api/notifications/test
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "type": "email",
  "recipient": "user@example.com",
  "title": "Test Notification",
  "message": "This is a test notification"
}
```

#### Template Management
```http
# Get all templates
GET /api/notifications/templates

# Create template
POST /api/notifications/templates
Content-Type: application/json

{
  "name": "welcome",
  "type": "email",
  "subject": "Welcome {{name}}!",
  "body": "Welcome to our platform...",
  "category": "account"
}

# Update template
PUT /api/notifications/templates/:id

# Delete template
DELETE /api/notifications/templates/:id

# Preview template
POST /api/notifications/templates/:id/preview
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}

# Validate template
POST /api/notifications/templates/:id/validate
```

#### Analytics
```http
GET /api/notifications/analytics/overview
Query Params: startDate, endDate, type, category
```

## Event Processing

The service automatically processes these Kafka events:

### User Events
- `user.registered` → Welcome email + in-app notification
- `user.login` → Security notification email
- `user.password_changed` → Confirmation email + in-app notification

### Auth Events
- `auth.password_reset_requested` → Password reset email

### System Events
- `system.service_started` → Admin notifications (future)

## Template System

### Handlebars Templates

Templates support variables using Handlebars syntax:

```handlebars
{{name}}, welcome to {{appName}}!

Your order #{{orderId}} has been {{status}}.

{{#if urgent}}This requires immediate attention!{{/if}}
```

### Built-in Helpers

- `{{formatDate date}}` - Format dates
- `{{formatCurrency amount}}` - Format currency
- `{{uppercase text}}` - Convert to uppercase
- `{{truncate text 50}}` - Truncate text
- `{{default value "fallback"}}` - Default values

### Template Variables

Each template defines required and optional variables:

```json
{
  "variables": [
    {
      "name": "name",
      "description": "User's full name",
      "required": true
    },
    {
      "name": "resetLink",
      "description": "Password reset URL",
      "required": true
    }
  ]
}
```

## Configuration

### Environment Variables

```env
# Service
NODE_ENV=development
PORT=3003
MONGO_URI=mongodb://localhost:27017/medicinefinder
JWT_SECRET=your-jwt-secret

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-service
KAFKA_GROUP_ID=notification-service-group

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email (Brevo/SendinBlue)
BREVO_API_KEY=your-brevo-api-key
```

## Notification Types

### Email Notifications
- **Provider**: SMTP or Brevo (SendinBlue)
- **Features**: HTML templates, tracking, attachments
- **Templates**: Welcome, password reset, security alerts

### In-App Notifications
- **Storage**: MongoDB
- **Features**: Read/unread status, categories, actions
- **Templates**: System messages, updates

## Database Models

### Notification
```javascript
{
  userId: ObjectId,
  type: "email|in_app",
  title: String,
  message: String,
  recipient: String,
  status: "pending|sent|delivered|failed",
  provider: String,
  category: String,
  templateData: Object,
  sentAt: Date,
  readAt: Date // for in-app
}
```

### NotificationTemplate
```javascript
{
  name: String,
  type: String,
  subject: String, // for email
  body: String,
  htmlBody: String, // for email
  variables: Array,
  category: String,
  isActive: Boolean
}
```

### NotificationPreference
```javascript
{
  userId: ObjectId,
  email: {
    enabled: Boolean,
    categories: Object
  },
  inApp: {
    enabled: Boolean,
    categories: Object
  },
  quietHours: Object
}
```

## Testing

### Test Notifications
```bash
# Run notification tests
npm run test:notifications

# Test Kafka event processing
cd services/user-service && npm run test:kafka
```

### Manual Testing
```bash
# Send test email
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": "test@example.com",
    "title": "Test Email",
    "message": "This is a test notification"
  }'
```

## Monitoring

### Health Checks
```bash
curl http://localhost:3003/health
```

### Analytics Dashboard
- Notification delivery rates
- Template usage statistics
- User engagement metrics
- Failure rate monitoring

## Development

### Adding New Templates
1. Create template in database or via API
2. Add template variables
3. Test with preview endpoint
4. Update event handlers

### Adding New Notification Types
1. Create service module (e.g., `services/whatsappService.js`)
2. Add to notification controller
3. Update preference schema
4. Add to event handlers

### Custom Event Processing
```javascript
// Add to notificationEventHandlers.js
case EVENT_TYPES.CUSTOM_EVENT:
  await handleCustomEvent(data, metadata);
  break;
```

## Production Considerations

- **Rate Limiting**: Implement per-user and global limits
- **Queue Management**: Use Redis for high-volume scenarios
- **Retry Logic**: Exponential backoff for failed deliveries
- **Monitoring**: Set up alerts for delivery failures
- **Backup**: Regular database backups
- **Security**: Encrypt sensitive notification data

## Troubleshooting

### Common Issues

1. **Notifications not sending**
   - Check provider credentials
   - Verify user preferences
   - Check Kafka connectivity

2. **Templates not rendering**
   - Validate template syntax
   - Check variable names
   - Test with preview endpoint

3. **High latency**
   - Monitor Kafka lag
   - Check database performance
   - Implement caching

### Logs
```bash
# Docker logs
docker logs notification-service

# Kafka topics
docker exec kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic user-events
```

## Contributing

1. Follow existing patterns for new notification types
2. Add comprehensive tests
3. Update documentation
4. Test with different providers
5. Consider backward compatibility

## License

This service is part of the MedicineFinder backend system.
