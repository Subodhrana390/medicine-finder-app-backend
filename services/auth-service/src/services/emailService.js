import SibApiV3Sdk from "@sendinblue/client";
import dotenv from "dotenv";

dotenv.config();

// Initialize Brevo (Sendinblue) client
const client = new SibApiV3Sdk.TransactionalEmailsApi();

if (process.env.BREVO_API_KEY) {
  client.setApiKey(
    SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );
} else {
  console.warn("⚠️ BREVO_API_KEY not found - email functionality will not work");
}

/**
 * Send email using Brevo (Sendinblue)
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {Object} options - Additional options
 */
export const sendEmail = async (to, subject, html, options = {}) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const data = {
      sender: {
        name: options.senderName || "MedicineFinder",
        email: process.env.BREVO_USER || "noreply@medicinefinder.com"
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      ...options
    };

    const result = await client.sendTransacEmail(data);
    console.log("✅ Email sent successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's name
 */
export const sendPasswordResetEmail = async (to, resetToken, userName = "User") => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You requested a password reset for your MedicineFinder account.</p>
        <p>Please click the link below to reset your password:</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p><strong>This link expires in 10 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by MedicineFinder. If you have any questions, please contact our support team.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, "Password Reset Request - MedicineFinder", html);
};

/**
 * Send 2FA verification code email
 * @param {string} to - Recipient email
 * @param {string} code - 6-digit verification code
 * @param {string} userName - User's name
 */
export const sendTwoFactorCodeEmail = async (to, code, userName = "User") => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Two-Factor Authentication</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Two-Factor Authentication Code</h2>
        <p>Hello ${userName},</p>
        <p>Your two-factor authentication code for MedicineFinder is:</p>
        <div style="background-color: #f8f9fa; border: 2px solid #3498db; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #3498db; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
        </div>
        <p><strong>This code expires in 10 minutes.</strong></p>
        <p>If you didn't request this code, please secure your account immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by MedicineFinder. Never share this code with anyone.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, "Your 2FA Code - MedicineFinder", html);
};

/**
 * Send account verification email
 * @param {string} to - Recipient email
 * @param {string} verificationToken - Email verification token
 * @param {string} userName - User's name
 */
export const sendVerificationEmail = async (to, verificationToken, userName = "User") => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Welcome to MedicineFinder!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering with MedicineFinder. Please verify your email address to complete your registration.</p>
        <p style="margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p><strong>This link expires in 24 hours.</strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by MedicineFinder. If you didn't create an account, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, "Verify Your Email - MedicineFinder", html);
};

/**
 * Send welcome email after successful registration
 * @param {string} to - Recipient email
 * @param {string} userName - User's name
 */
export const sendWelcomeEmail = async (to, userName = "User") => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to MedicineFinder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Welcome to MedicineFinder! 🎉</h2>
        <p>Hello ${userName},</p>
        <p>Welcome to MedicineFinder! Your account has been successfully created.</p>
        <p>You can now:</p>
        <ul>
          <li>Search for medicines and pharmacies</li>
          <li>Manage your orders and prescriptions</li>
          <li>Access exclusive offers and discounts</li>
          <li>Track your order history</li>
        </ul>
        <p style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}"
             style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Start Exploring
          </a>
        </p>
        <p>For security, we recommend enabling two-factor authentication in your account settings.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by MedicineFinder. Need help? Contact our support team.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, "Welcome to MedicineFinder!", html);
};
