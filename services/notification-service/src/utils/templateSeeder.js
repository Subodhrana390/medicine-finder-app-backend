import NotificationTemplate from '../models/NotificationTemplate.js';

/**
 * Default notification templates
 */
const defaultTemplates = [
  // Welcome email
  {
    name: "welcome",
    description: "Welcome email sent to new users",
    type: "email",
    subject: "Welcome to MedicineFinder, {{name}}!",
    body: `Hi {{name}},

Welcome to MedicineFinder! We're excited to have you join our community.

Your account has been successfully created and you can now:
- Search for medicines and pharmacies
- Manage your prescriptions
- Receive important health notifications
- Access exclusive offers from partnered pharmacies

If you have any questions, feel free to contact our support team.

Best regards,
The MedicineFinder Team`,
    htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">Welcome to MedicineFinder, {{name}}!</h1>
  <p>We're excited to have you join our community.</p>

  <p>Your account has been successfully created and you can now:</p>
  <ul>
    <li>Search for medicines and pharmacies</li>
    <li>Manage your prescriptions</li>
    <li>Receive important health notifications</li>
    <li>Access exclusive offers from partnered pharmacies</li>
  </ul>

  <p>If you have any questions, feel free to contact our support team.</p>

  <p style="margin-top: 30px;">Best regards,<br>The MedicineFinder Team</p>
</div>`,
    category: "account",
    variables: [
      { name: "name", description: "User's full name", required: true },
      { name: "email", description: "User's email address", required: true }
    ]
  },

  // Password reset
  {
    name: "password_reset",
    description: "Password reset notification",
    type: "email",
    subject: "Password Reset Request",
    body: `Hi there,

We received a request to reset your password for your MedicineFinder account.

If you made this request, click the link below to reset your password:
{{resetLink}}

This link will expire in 10 minutes for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The MedicineFinder Team`,
    htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Password Reset Request</h2>
  <p>Hi there,</p>
  <p>We received a request to reset your password for your MedicineFinder account.</p>

  <p>If you made this request, click the button below to reset your password:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{resetLink}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
  </div>

  <p><strong>This link will expire in 10 minutes</strong> for security reasons.</p>

  <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>

  <p>Best regards,<br>The MedicineFinder Team</p>
</div>`,
    category: "security",
    variables: [
      { name: "resetLink", description: "Password reset link", required: true }
    ]
  },

  // Login notification
  {
    name: "login_notification",
    description: "Security notification for new login",
    type: "email",
    subject: "New Login to Your MedicineFinder Account",
    body: `Hi there,

We detected a new login to your MedicineFinder account.

Login Details:
- Date & Time: {{timestamp}}
- Device: {{device}}
- Location: {{ipAddress}}

If this was you, no action is needed.

If you don't recognize this activity, please:
1. Change your password immediately
2. Contact our support team
3. Review your account security settings

For your security, we recommend enabling two-factor authentication.

Best regards,
The MedicineFinder Team`,
    htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #dc3545;">New Login Detected</h2>
  <p>Hi there,</p>
  <p>We detected a new login to your MedicineFinder account.</p>

  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3>Login Details:</h3>
    <ul>
      <li><strong>Date & Time:</strong> {{timestamp}}</li>
      <li><strong>Device:</strong> {{device}}</li>
      <li><strong>Location:</strong> {{ipAddress}}</li>
    </ul>
  </div>

  <p>If this was you, no action is needed.</p>

  <p><strong>If you don't recognize this activity, please:</strong></p>
  <ol>
    <li>Change your password immediately</li>
    <li>Contact our support team</li>
    <li>Review your account security settings</li>
  </ol>

  <p>For your security, we recommend enabling two-factor authentication.</p>

  <p>Best regards,<br>The MedicineFinder Team</p>
</div>`,
    category: "security",
    variables: [
      { name: "timestamp", description: "Login timestamp", required: true },
      { name: "device", description: "Device information", required: true },
      { name: "ipAddress", description: "IP address", required: true }
    ]
  },

  // Password changed
  {
    name: "password_changed",
    description: "Confirmation of password change",
    type: "email",
    subject: "Your Password Has Been Changed",
    body: `Hi there,

Your MedicineFinder account password has been successfully changed.

Change Details:
- Date & Time: {{timestamp}}

If you made this change, no action is needed.

If you didn't make this change, please:
1. Contact our support team immediately
2. Consider changing your password again
3. Check your account for any unauthorized activity

For enhanced security, we recommend:
- Using a strong, unique password
- Enabling two-factor authentication
- Regularly monitoring your account activity

Best regards,
The MedicineFinder Team`,
    htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #28a745;">Password Changed Successfully</h2>
  <p>Hi there,</p>
  <p>Your MedicineFinder account password has been successfully changed.</p>

  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <strong>Change Details:</strong><br>
    Date & Time: {{timestamp}}
  </div>

  <p>If you made this change, no action is needed.</p>

  <p><strong>If you didn't make this change, please:</strong></p>
  <ol>
    <li>Contact our support team immediately</li>
    <li>Consider changing your password again</li>
    <li>Check your account for any unauthorized activity</li>
  </ol>

  <p><strong>For enhanced security, we recommend:</strong></p>
  <ul>
    <li>Using a strong, unique password</li>
    <li>Enabling two-factor authentication</li>
    <li>Regularly monitoring your account activity</li>
  </ul>

  <p>Best regards,<br>The MedicineFinder Team</p>
</div>`,
    category: "security",
    variables: [
      { name: "timestamp", description: "Password change timestamp", required: true }
    ]
  },

  // Order confirmation (placeholder for future e-commerce features)
  {
    name: "order_confirmation",
    description: "Order confirmation notification",
    type: "email",
    subject: "Order Confirmation - Order #{{orderId}}",
    body: `Hi {{name}},

Thank you for your order! Your order has been confirmed.

Order Details:
- Order ID: {{orderId}}
- Total Amount: {{totalAmount}}
- Estimated Delivery: {{deliveryDate}}

You will receive another email when your order is ready for pickup or delivery.

Track your order status in your MedicineFinder account.

Best regards,
The MedicineFinder Team`,
    htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Order Confirmation</h2>
  <p>Hi {{name}},</p>
  <p>Thank you for your order! Your order has been confirmed.</p>

  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3>Order Details:</h3>
    <ul>
      <li><strong>Order ID:</strong> {{orderId}}</li>
      <li><strong>Total Amount:</strong> {{totalAmount}}</li>
      <li><strong>Estimated Delivery:</strong> {{deliveryDate}}</li>
    </ul>
  </div>

  <p>You will receive another email when your order is ready for pickup or delivery.</p>
  <p>Track your order status in your MedicineFinder account.</p>

  <p>Best regards,<br>The MedicineFinder Team</p>
</div>`,
    category: "transaction",
    variables: [
      { name: "name", description: "Customer name", required: true },
      { name: "orderId", description: "Order ID", required: true },
      { name: "totalAmount", description: "Order total", required: true },
      { name: "deliveryDate", description: "Delivery date", required: true }
    ]
  }
];

/**
 * Seed default notification templates
 */
export const seedDefaultTemplates = async () => {
  try {
    console.log('🌱 Seeding default notification templates...');

    for (const templateData of defaultTemplates) {
      const existingTemplate = await NotificationTemplate.findOne({
        name: templateData.name,
        type: templateData.type
      });

      if (!existingTemplate) {
        await NotificationTemplate.create(templateData);
        console.log(`✅ Created template: ${templateData.name}`);
      } else {
        console.log(`⏭️  Template already exists: ${templateData.name}`);
      }
    }

    console.log('✅ Template seeding completed');
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  }
};

/**
 * Initialize notification service
 */
export const initializeNotificationService = async () => {
  try {
    await seedDefaultTemplates();
    console.log('🚀 Notification service initialized with default templates');
  } catch (error) {
    console.error('❌ Failed to initialize notification service:', error);
    throw error;
  }
};
