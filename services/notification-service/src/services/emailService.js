import nodemailer from 'nodemailer';
import * as Brevo from '@sendinblue/client';
import Notification from '../models/Notification.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import { compileTemplate } from '../utils/templateUtils.js';

// Brevo (SendinBlue) configuration
let brevoClient = null;
let nodemailerTransporter = null;

/**
 * Initialize email services
 */
export const initEmailServices = () => {
  // Initialize Brevo client
  if (process.env.BREVO_API_KEY) {
    brevoClient = Brevo.ApiClient.instance;
    const apiKey = brevoClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
  }

  // Initialize Nodemailer transporter (fallback)
  if (process.env.SMTP_HOST) {
    nodemailerTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
};

/**
 * Send email notification
 */
export const sendEmailNotification = async ({
  userId,
  recipient,
  template,
  templateData = {},
  subject,
  body,
  category = 'system',
  priority = 'normal'
}) => {
  try {
    // Check if user has email notifications enabled for this category
    const shouldSend = await checkEmailPreference(userId, category);
    if (!shouldSend) {
      console.log(`📧 Email notification skipped for user ${userId} - preference disabled`);
      return null;
    }

    let emailSubject = subject;
    let emailBody = body;
    let htmlBody = body;

    // Use template if provided
    if (template && !body) {
      const templateResult = await renderEmailTemplate(template, templateData, userId);
      if (templateResult) {
        emailSubject = templateResult.subject;
        emailBody = templateResult.textBody;
        htmlBody = templateResult.htmlBody;
      }
    }

    // Create notification record
    const notification = await Notification.create({
      userId,
      type: 'email',
      title: emailSubject,
      message: emailBody,
      recipient,
      provider: process.env.BREVO_API_KEY ? 'brevo' : 'nodemailer',
      category,
      priority,
      templateData,
      status: 'pending'
    });

    // Send email
    let result;
    if (brevoClient) {
      result = await sendWithBrevo(recipient, emailSubject, emailBody, htmlBody);
    } else if (nodemailerTransporter) {
      result = await sendWithNodemailer(recipient, emailSubject, emailBody, htmlBody);
    } else {
      throw new Error('No email service configured');
    }

    // Update notification status
    await Notification.findByIdAndUpdate(notification._id, {
      status: 'sent',
      providerMessageId: result.messageId,
      sentAt: new Date()
    });

    console.log(`📧 Email sent successfully to ${recipient} via ${result.provider}`);
    return { notificationId: notification._id, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Failed to send email notification:', error);

    // Update notification status to failed
    if (userId) {
      await Notification.findOneAndUpdate(
        { userId, type: 'email', status: 'pending' },
        {
          status: 'failed',
          errorMessage: error.message,
          $inc: { retryCount: 1 }
        },
        { sort: { createdAt: -1 } }
      );
    }

    throw error;
  }
};

/**
 * Send email using Brevo (SendinBlue)
 */
const sendWithBrevo = async (to, subject, textBody, htmlBody) => {
  const apiInstance = new Brevo.TransactionalEmailsApi();

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlBody;
  sendSmtpEmail.textContent = textBody;
  sendSmtpEmail.sender = {
    name: process.env.EMAIL_FROM_NAME || 'MedicineFinder',
    email: process.env.EMAIL_FROM || 'noreply@medicinefinder.com'
  };
  sendSmtpEmail.to = [{ email: to }];

  const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

  return {
    messageId: result.body.messageId,
    provider: 'brevo'
  };
};

/**
 * Send email using Nodemailer (fallback)
 */
const sendWithNodemailer = async (to, subject, textBody, htmlBody) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'MedicineFinder'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    text: textBody,
    html: htmlBody,
  };

  const result = await nodemailerTransporter.sendMail(mailOptions);

  return {
    messageId: result.messageId,
    provider: 'nodemailer'
  };
};

/**
 * Render email template
 */
const renderEmailTemplate = async (templateName, data, userId) => {
  try {
    const template = await NotificationTemplate.findOne({
      name: templateName,
      type: 'email',
      isActive: true
    });

    if (!template) {
      console.warn(`Email template '${templateName}' not found`);
      return null;
    }

    // Increment usage count
    await NotificationTemplate.findByIdAndUpdate(template._id, {
      $inc: { usageCount: 1 },
      lastUsed: new Date()
    });

    // Compile template with data
    const subject = compileTemplate(template.subject, data);
    const textBody = compileTemplate(template.body, data);
    const htmlBody = compileTemplate(template.htmlBody || template.body, data);

    return { subject, textBody, htmlBody };
  } catch (error) {
    console.error('Error rendering email template:', error);
    return null;
  }
};

/**
 * Check if user has email notifications enabled for a category
 */
const checkEmailPreference = async (userId, category) => {
  try {
    // This would integrate with NotificationPreference model
    // For now, return true as default
    return true;
  } catch (error) {
    console.error('Error checking email preference:', error);
    return true; // Default to true on error
  }
};

/**
 * Send bulk email notifications
 */
export const sendBulkEmailNotifications = async (notifications) => {
  const results = [];

  for (const notification of notifications) {
    try {
      const result = await sendEmailNotification(notification);
      results.push({ success: true, ...result });
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        recipient: notification.recipient
      });
    }
  }

  return results;
};
