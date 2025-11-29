# Medical Shop Service

A comprehensive microservice for managing medical shops, medicines, and inventory in the MedicineFinder platform.

## 🚀 Features

### 🏪 Medical Shop Management
- **Shop Registration**: Complete shop onboarding with license verification
- **Profile Management**: Update shop details, operating hours, services
- **Location Services**: GPS-based shop discovery and proximity search
- **Document Upload**: License, GST certificate, and address proof management

### 💊 Medicine Catalog
- **Comprehensive Database**: Extensive medicine catalog with categories
- **Prescription Tracking**: Manage prescription-required medicines
- **Batch Management**: Track medicine batches, expiry dates, manufacturers
- **Search & Filter**: Advanced search with multiple filter options

### 📦 Inventory Management
- **Stock Tracking**: Real-time inventory monitoring and updates
- **Stock Movements**: Detailed audit trail of all inventory changes
- **Low Stock Alerts**: Automated notifications for inventory replenishment
- **Expiry Management**: Proactive expiry date monitoring and alerts
- **Pricing Control**: Flexible pricing with MRP, discounts, and tax management

### 🔍 Advanced Features
- **Geospatial Search**: Find nearby medical shops using GPS coordinates
- **Real-time Updates**: Live inventory and shop status updates
- **Event-Driven Architecture**: Kafka-based event publishing and consumption
- **File Upload**: Image and document management with cloud storage support

## 🛠️ Technology Stack

- **Runtime**: Node.js with ES6+ modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Message Broker**: Apache Kafka for event streaming
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod schemas
- **File Upload**: Multer with Sharp image processing
- **Geospatial**: MongoDB geospatial queries
- **Security**: Helmet, CORS, rate limiting

## 📊 API Endpoints

### Shop Management
- `POST /api/shops` - Create new medical shop
- `GET /api/shops` - Get shops with filtering and search
- `GET /api/shops/:id` - Get shop details
- `PUT /api/shops/:id` - Update shop information
- `PATCH /api/shops/:id/status` - Update shop status
- `POST /api/shops/:id/images` - Upload shop images

### Medicine Catalog
- `POST /api/shops/medicines` - Add new medicine
- `GET /api/shops/medicines` - Get medicines with filters
- `GET /api/shops/medicines/search` - Advanced medicine search
- `GET /api/shops/medicines/:id` - Get medicine details
- `PUT /api/shops/medicines/:id` - Update medicine
- `DELETE /api/shops/medicines/:id` - Discontinue medicine
- `GET /api/shops/medicines/category/:category` - Get medicines by category

### Inventory Management
- `POST /api/shops/inventory` - Add inventory item
- `GET /api/shops/inventory/shop/:shopId` - Get shop inventory
- `PUT /api/shops/inventory/:id` - Update inventory item
- `POST /api/shops/inventory/:id/movement` - Record stock movement
- `GET /api/shops/inventory/:shopId/alerts` - Get inventory alerts
- `POST /api/shops/inventory/bulk-update` - Bulk inventory update
- `GET /api/shops/inventory/:shopId/summary` - Inventory summary

## 🗃️ Database Models

### MedicalShop
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
  status: String, // active, inactive, suspended
  verificationStatus: String, // unverified, pending, verified, rejected
  ratings: { average: Number, count: Number }
}
```

### Medicine
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

### Inventory
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

## 🎯 Key Features

### Smart Inventory Management
- **Automatic Alerts**: Low stock and expiry notifications
- **Stock Reservation**: Order-based inventory reservation
- **Audit Trail**: Complete stock movement history
- **Bulk Operations**: Efficient bulk inventory updates

### Advanced Search & Discovery
- **Geospatial Queries**: Find shops within radius
- **Text Search**: Full-text search across medicine names and descriptions
- **Category Filtering**: Browse medicines by therapeutic categories
- **Prescription Tracking**: Filter prescription-required medicines

### Event-Driven Architecture
- **Shop Events**: Creation, updates, status changes
- **Inventory Events**: Stock movements, alerts, updates
- **Medicine Events**: New additions, updates, discontinuations
- **Order Integration**: Real-time inventory updates from orders

## 🔧 Configuration

### Environment Variables
```env
NODE_ENV=production
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

### File Upload Limits
- **Shop Images**: 5 images, max 2MB each
- **Medicine Images**: 3 images, max 1MB each
- **Documents**: License, certificates, max 5MB each

## 🚀 Quick Start

### Using Docker Compose
```bash
# Start all services
docker-compose up --build

# Check service health
curl http://localhost:3004/health
```

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## 🔍 API Examples

### Create Medical Shop
```bash
curl -X POST http://localhost:3004/api/shops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "City Pharmacy",
    "licenseNumber": "MH123456789",
    "contactInfo": {
      "phone": "+919876543210",
      "email": "contact@citypharmacy.com"
    },
    "address": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001"
    }
  }'
```

### Search Nearby Shops
```bash
curl "http://localhost:3004/api/shops?latitude=19.0760&longitude=72.8777&radius=10&limit=5"
```

### Add Inventory
```bash
curl -X POST http://localhost:3004/api/shops/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "shopId": "60f1b2b3c4d5e6f7g8h9i0j1",
    "medicineId": "60f1b2b3c4d5e6f7g8h9i0j2",
    "batchNumber": "BATCH001",
    "quantity": 100,
    "pricing": {
      "costPrice": 10.50,
      "sellingPrice": 12.00,
      "mrp": 15.00
    },
    "expiryDate": "2025-12-31"
  }'
```

## 📊 Monitoring & Analytics

- **Health Checks**: `/health` endpoint for service monitoring
- **Inventory Reports**: Real-time stock levels and alerts
- **Shop Performance**: Ratings, reviews, and operational metrics
- **Event Streaming**: Kafka-based event monitoring and analytics

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Shop owners, admins, and customers
- **File Validation**: Secure file upload with type and size validation
- **Rate Limiting**: API rate limiting for abuse prevention
- **Input Validation**: Comprehensive Zod schema validation

## 🔄 Event Integration

The service integrates with other microservices through Kafka events:

- **User Service**: Shop owner registration and updates
- **Order Service**: Real-time inventory updates from orders
- **Notification Service**: Automated alerts and communications

## 📈 Future Enhancements

- **AI-Powered Search**: Intelligent medicine recommendations
- **Barcode Scanning**: Quick inventory management via mobile app
- **Predictive Analytics**: Demand forecasting and auto-replenishment
- **Multi-Language Support**: Localized medicine information
- **Integration APIs**: Third-party pharmacy system integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for the MedicineFinder platform**
