import Notification from '../models/Notification.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import { compileTemplate } from '../utils/templateUtils.js';

/**
 * Create in-app notification
 */
export const createInAppNotification = async ({
  userId,
  title,
  message,
  template,
  templateData = {},
  category = 'system',
  priority = 'normal',
  expiresAt,
  actionUrl, // URL to redirect when clicked
  actionText, // Text for action button
  metadata = {}
}) => {
  try {
    // Check if user has in-app notifications enabled for this category
    const shouldSend = await checkInAppPreference(userId, category);
    if (!shouldSend) {
      console.log(`💬 In-app notification skipped for user ${userId} - preference disabled`);
      return null;
    }

    let notificationTitle = title;
    let notificationMessage = message;

    // Use template if provided
    if (template && (!title || !message)) {
      const templateResult = await renderInAppTemplate(template, templateData, userId);
      if (templateResult) {
        notificationTitle = templateResult.title;
        notificationMessage = templateResult.message;
      }
    }

    // Create notification record
    const notification = await Notification.create({
      userId,
      type: 'in_app',
      title: notificationTitle,
      message: notificationMessage,
      recipient: userId, // For in-app, recipient is the user ID
      provider: 'internal',
      category,
      priority,
      templateData: {
        ...templateData,
        actionUrl,
        actionText,
        expiresAt,
        ...metadata
      },
      status: 'sent', // In-app notifications are immediately available
      sentAt: new Date()
    });

    console.log(`💬 In-app notification created for user ${userId}: ${notificationTitle}`);
    return { notificationId: notification._id };

  } catch (error) {
    console.error('❌ Failed to create in-app notification:', error);
    throw error;
  }
};

/**
 * Render in-app notification template
 */
const renderInAppTemplate = async (templateName, data, userId) => {
  try {
    const template = await NotificationTemplate.findOne({
      name: templateName,
      type: 'in_app',
      isActive: true
    });

    if (!template) {
      console.warn(`In-app template '${templateName}' not found`);
      return null;
    }

    // Increment usage count
    await NotificationTemplate.findByIdAndUpdate(template._id, {
      $inc: { usageCount: 1 },
      lastUsed: new Date()
    });

    // Compile template with data
    const title = compileTemplate(template.subject, data);
    const message = compileTemplate(template.body, data);

    return { title, message };
  } catch (error) {
    console.error('Error rendering in-app template:', error);
    return null;
  }
};

/**
 * Check if user has in-app notifications enabled for a category
 */
const checkInAppPreference = async (userId, category) => {
  try {
    // This would integrate with NotificationPreference model
    // For now, return true as default
    return true;
  } catch (error) {
    console.error('Error checking in-app preference:', error);
    return true; // Default to true on error
  }
};

/**
 * Get user's in-app notifications
 */
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'sent',
      category,
      isRead
    } = options;

    const query = { userId, type: 'in_app' };

    if (status) query.status = status;
    if (category) query.category = category;
    if (isRead !== undefined) query.isRead = isRead;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId, type: 'in_app' },
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    console.log(`✅ Notification ${notificationId} marked as read`);
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId, category = null) => {
  try {
    const query = {
      userId,
      type: 'in_app',
      isRead: false
    };

    if (category) {
      query.category = category;
    }

    const result = await Notification.updateMany(query, {
      isRead: true,
      readAt: new Date()
    });

    console.log(`✅ Marked ${result.modifiedCount} notifications as read for user ${userId}`);
    return { success: true, modifiedCount: result.modifiedCount };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
      type: 'in_app'
    });

    if (!result) {
      throw new Error('Notification not found');
    }

    console.log(`🗑️ Notification ${notificationId} deleted`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Get notification statistics for a user
 */
export const getNotificationStats = async (userId) => {
  try {
    const stats = await Notification.aggregate([
      { $match: { userId, type: 'in_app' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          },
          byCategory: {
            $push: {
              category: '$category',
              isRead: '$isRead'
            }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, unread: 0, byCategory: [] };

    // Calculate category breakdown
    const categoryStats = {};
    result.byCategory.forEach(item => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { total: 0, unread: 0 };
      }
      categoryStats[item.category].total += 1;
      if (!item.isRead) {
        categoryStats[item.category].unread += 1;
      }
    });

    return {
      total: result.total,
      unread: result.unread,
      read: result.total - result.unread,
      byCategory: categoryStats
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw error;
  }
};
