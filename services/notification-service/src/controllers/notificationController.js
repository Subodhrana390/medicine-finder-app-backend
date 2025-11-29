import Notification from '../models/Notification.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import NotificationPreference from '../models/NotificationPreference.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { sendEmailNotification } from '../services/emailService.js';
import {
  createInAppNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationStats
} from '../services/inAppService.js';
import { validateTemplate, previewTemplate } from '../utils/templateUtils.js';

/**
 * Get user's notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const options = req.query;

  const result = await getUserNotifications(userId, options);

  res.json({
    success: true,
    data: result
  });
});

/**
 * Get notification by ID
 */
export const getNotificationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await Notification.findOne({
    _id: id,
    userId
  }).select('-__v');

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    notification
  });
});

/**
 * Mark notification as read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await markNotificationAsRead(id, userId);

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { category } = req.query;

  const result = await markAllNotificationsAsRead(userId, category);

  res.json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read`,
    data: result
  });
});

/**
 * Delete notification
 */
export const deleteNotificationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await deleteNotification(id, userId);

  res.json({
    success: true,
    message: 'Notification deleted'
  });
});

/**
 * Get notification statistics
 */
export const getStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const stats = await getNotificationStats(userId);

  res.json({
    success: true,
    stats
  });
});

/**
 * Send test notification (Admin only)
 */
export const sendTestNotification = asyncHandler(async (req, res) => {
  const { type, recipient, title, message, category } = req.body;

  let result;
  switch (type) {
    case 'email':
      result = await sendEmailNotification({
        userId: req.user.id,
        recipient,
        subject: title,
        message,
        category: category || 'system'
      });
      break;


    case 'in_app':
      result = await createInAppNotification({
        userId: req.user.id,
        title,
        message,
        category: category || 'system'
      });
      break;

    default:
      const error = new Error('Invalid notification type');
      error.statusCode = 400;
      throw error;
  }

  res.json({
    success: true,
    message: 'Test notification sent',
    data: result
  });
});

/**
 * Get user's notification preferences
 */
export const getPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const preferences = await NotificationPreference.findOne({ userId }).lean();

  res.json({
    success: true,
    preferences: preferences || {}
  });
});

/**
 * Update user's notification preferences
 */
export const updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;

  const preferences = await NotificationPreference.findOneAndUpdate(
    { userId },
    updates,
    { upsert: true, new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Notification preferences updated',
    preferences
  });
});

/**
 * Create notification template (Admin only)
 */
export const createTemplate = asyncHandler(async (req, res) => {
  const templateData = req.body;

  const template = await NotificationTemplate.create(templateData);

  res.status(201).json({
    success: true,
    message: 'Notification template created',
    template
  });
});

/**
 * Get notification templates (Admin only)
 */
export const getTemplates = asyncHandler(async (req, res) => {
  const { type, category, isActive } = req.query;

  const query = {};
  if (type) query.type = type;
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const templates = await NotificationTemplate.find(query)
    .sort({ createdAt: -1 })
    .select('-__v');

  res.json({
    success: true,
    templates
  });
});

/**
 * Get template by ID (Admin only)
 */
export const getTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const template = await NotificationTemplate.findById(id);

  if (!template) {
    const error = new Error('Template not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    template
  });
});

/**
 * Update template (Admin only)
 */
export const updateTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const template = await NotificationTemplate.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  );

  if (!template) {
    const error = new Error('Template not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    message: 'Template updated',
    template
  });
});

/**
 * Delete template (Admin only)
 */
export const deleteTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const template = await NotificationTemplate.findByIdAndDelete(id);

  if (!template) {
    const error = new Error('Template not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    message: 'Template deleted'
  });
});

/**
 * Preview template (Admin only)
 */
export const previewTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sampleData = req.body;

  const template = await NotificationTemplate.findById(id);

  if (!template) {
    const error = new Error('Template not found');
    error.statusCode = 404;
    throw error;
  }

  let preview;
  if (template.type === 'email') {
    preview = {
      subject: previewTemplate(template.subject, sampleData),
      textBody: previewTemplate(template.body, sampleData),
      htmlBody: previewTemplate(template.htmlBody || template.body, sampleData)
    };
  } else {
    preview = {
      content: previewTemplate(template.body, sampleData)
    };
  }

  res.json({
    success: true,
    preview
  });
});

/**
 * Validate template (Admin only)
 */
export const validateTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const template = await NotificationTemplate.findById(id);

  if (!template) {
    const error = new Error('Template not found');
    error.statusCode = 404;
    throw error;
  }

  const validation = validateTemplate(template.body, template.variables || []);

  res.json({
    success: true,
    validation
  });
});

/**
 * Get notification analytics (Admin only)
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, category } = req.query;

  const matchStage = { createdAt: {} };
  if (startDate) matchStage.createdAt.$gte = new Date(startDate);
  if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  if (type) matchStage.type = type;
  if (category) matchStage.category = category;

  const analytics = await Notification.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status',
          category: '$category',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        byType: {
          $push: {
            type: '$_id.type',
            status: '$_id.status',
            category: '$_id.category',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    },
    { $sort: { '_id': -1 } },
    { $limit: 30 }
  ]);

  // Get overall stats
  const overallStats = await Notification.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byStatus: {
          $push: {
            status: '$status',
            count: { $sum: 1 }
          }
        },
        byType: {
          $push: {
            type: '$type',
            count: { $sum: 1 }
          }
        },
        byCategory: {
          $push: {
            category: '$category',
            count: { $sum: 1 }
          }
        }
      }
    }
  ]);

  res.json({
    success: true,
    analytics,
    overall: overallStats[0] || {}
  });
});
