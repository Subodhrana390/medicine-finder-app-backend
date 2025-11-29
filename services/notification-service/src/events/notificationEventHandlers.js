import NotificationPreference from "../models/NotificationPreference.js";
import { sendEmailNotification } from "../services/emailService.js";
import { createInAppNotification } from "../services/inAppService.js";
import { EVENT_TYPES } from "./eventTypes.js";

/**
 * Handle events that trigger notifications
 */
export const handleNotificationEvents = async (event, messageInfo) => {
  try {
    const { type, data, metadata } = event;

    switch (type) {
      case EVENT_TYPES.USER_REGISTERED:
        await handleUserRegistration(data, metadata);
        break;

      case EVENT_TYPES.USER_LOGIN:
        await handleUserLogin(data, metadata);
        break;

      case EVENT_TYPES.USER_PASSWORD_CHANGED:
        await handlePasswordChange(data, metadata);
        break;

      case EVENT_TYPES.PASSWORD_RESET_REQUESTED:
        await handlePasswordResetRequest(data, metadata);
        break;

      case EVENT_TYPES.SERVICE_STARTED:
        await handleServiceStarted(data, metadata);
        break;

      default:
        console.log(`No notification handler for event type: ${type}`);
    }
  } catch (error) {
    console.error('Error handling notification event:', error);
    // In production, you might want to send failed events to a dead letter queue
  }
};

/**
 * Handle user registration event
 */
const handleUserRegistration = async (data, metadata) => {
  const { userId, email, name } = data;

  try {
    // Create default notification preferences
    await NotificationPreference.findOneAndUpdate(
      { userId },
      {
        userId,
        notificationsEnabled: true,
        email: {
          enabled: true,
          categories: {
            account: true,
            security: true,
            marketing: false,
            transaction: true,
            system: true,
            reminder: true
          }
        },
        sms: {
          enabled: false,
          categories: {
            account: false,
            security: true,
            marketing: false,
            transaction: true,
            system: false,
            reminder: false
          }
        },
        push: {
          enabled: true,
          categories: {
            account: true,
            security: true,
            marketing: false,
            transaction: true,
            system: true,
            reminder: true
          }
        },
        inApp: {
          enabled: true,
          categories: {
            account: true,
            security: true,
            marketing: false,
            transaction: true,
            system: true,
            reminder: true
          }
        }
      },
      { upsert: true, new: true }
    );

    // Send welcome email
    await sendEmailNotification({
      userId,
      recipient: email,
      template: "welcome",
      templateData: { name, email },
      category: "account"
    });

    // Send welcome in-app notification
    await createInAppNotification({
      userId,
      title: "Welcome to MedicineFinder!",
      message: `Hi ${name}, welcome to MedicineFinder! Your account has been created successfully.`,
      category: "account"
    });

    console.log(`✅ Welcome notifications sent for user: ${userId}`);
  } catch (error) {
    console.error('Error handling user registration:', error);
  }
};

/**
 * Handle user login event
 */
const handleUserLogin = async (data, metadata) => {
  const { userId, device, ipAddress } = data;

  try {
    // Send login notification email for security
    const shouldSendEmail = await checkNotificationPreference(userId, 'email', 'security');

    if (shouldSendEmail) {
      await sendEmailNotification({
        userId,
        recipient: await getUserEmail(userId), // You'd need to implement this
        template: "login_notification",
        templateData: {
          device,
          ipAddress,
          timestamp: new Date().toLocaleString()
        },
        category: "security"
      });
    }

    console.log(`✅ Login notification sent for user: ${userId}`);
  } catch (error) {
    console.error('Error handling user login:', error);
  }
};

/**
 * Handle password change event
 */
const handlePasswordChange = async (data, metadata) => {
  const { userId } = data;

  try {
    // Send password change confirmation email
    await sendEmailNotification({
      userId,
      recipient: await getUserEmail(userId), // You'd need to implement this
      template: "password_changed",
      templateData: {
        timestamp: new Date().toLocaleString()
      },
      category: "security"
    });

    // Send in-app notification
    await createInAppNotification({
      userId,
      title: "Password Changed",
      message: "Your password has been changed successfully. If you didn't make this change, please contact support immediately.",
      category: "security"
    });

    console.log(`✅ Password change notifications sent for user: ${userId}`);
  } catch (error) {
    console.error('Error handling password change:', error);
  }
};

/**
 * Handle password reset request event
 */
const handlePasswordResetRequest = async (data, metadata) => {
  const { email, resetTokenId } = data;

  try {
    // This would be handled by the auth service sending the reset email
    // The notification service could send additional notifications if needed
    console.log(`📧 Password reset email sent to: ${email}`);
  } catch (error) {
    console.error('Error handling password reset request:', error);
  }
};

/**
 * Handle service started event
 */
const handleServiceStarted = async (data, metadata) => {
  const { serviceName, version } = data;

  try {
    // Log service startup (could send admin notifications in production)
    console.log(`🚀 Service started: ${serviceName} v${version}`);
  } catch (error) {
    console.error('Error handling service started:', error);
  }
};

/**
 * Check if user has enabled notifications for a specific channel and category
 */
const checkNotificationPreference = async (userId, channel, category) => {
  try {
    const preferences = await NotificationPreference.findOne({ userId });

    if (!preferences) return true; // Default to true if no preferences set

    const channelPrefs = preferences[channel];
    if (!channelPrefs || !channelPrefs.enabled) return false;

    return channelPrefs.categories[category] !== false;
  } catch (error) {
    console.error('Error checking notification preference:', error);
    return true; // Default to true on error
  }
};

/**
 * Get user email (placeholder - you'd implement this to fetch from user service or cache)
 */
const getUserEmail = async (userId) => {
  // This is a placeholder - in production, you'd:
  // 1. Call the user service API
  // 2. Use a cached value
  // 3. Query a local replica
  // For now, return a placeholder
  return `user${userId}@example.com`;
};
