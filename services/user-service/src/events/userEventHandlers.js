import UserPreferences from "../models/UserPreferences.js";
import UserProfile from "../models/UserProfile.js";
import { EVENT_TYPES } from "./eventTypes.js";

/**
 * Handle user-related events from Kafka
 */
export const handleUserEvents = async (event, messageInfo) => {
  try {
    const { type, data, metadata } = event;

    switch (type) {
      case EVENT_TYPES.USER_REGISTERED:
        await handleUserRegistered(data);
        break;

      case EVENT_TYPES.USER_UPDATED:
        await handleUserUpdated(data);
        break;

      case EVENT_TYPES.USER_DELETED:
        await handleUserDeleted(data);
        break;

      case EVENT_TYPES.USER_LOGIN:
        await handleUserLogin(data);
        break;

      case EVENT_TYPES.USER_LOGOUT:
        await handleUserLogout(data);
        break;

      case EVENT_TYPES.USER_PASSWORD_CHANGED:
        await handlePasswordChanged(data);
        break;

      default:
        console.log(`Unhandled event type: ${type}`);
    }
  } catch (error) {
    console.error('Error handling user event:', error);
    // In production, you might want to send failed events to a dead letter queue
  }
};

/**
 * Handle user registered event
 * Create default user preferences and profile
 */
const handleUserRegistered = async (data) => {
  try {
    const { userId } = data;

    // Create default user preferences
    const defaultPreferences = {
      userId,
      emailNotifications: true,
      smsNotifications: true,
      language: 'en',
      timezone: 'Asia/Kolkata',
      theme: 'auto',
      locationSharing: false,
      profileVisibility: 'public',
      marketingEmails: false,
      promotionalSMS: false
    };

    await UserPreferences.findOneAndUpdate(
      { userId },
      defaultPreferences,
      { upsert: true, new: true }
    );

    // Create default user profile
    const defaultProfile = {
      userId,
      addresses: [],
      emergencyContacts: [],
      socialLinks: {},
      isVerified: false,
      verificationDocuments: []
    };

    await UserProfile.findOneAndUpdate(
      { userId },
      defaultProfile,
      { upsert: true, new: true }
    );

    console.log(`✅ Created default preferences and profile for user: ${userId}`);
  } catch (error) {
    console.error('Error creating user defaults:', error);
    throw error;
  }
};

/**
 * Handle user updated event
 * Update user profile information if needed
 */
const handleUserUpdated = async (data) => {
  try {
    const { userId, changes } = data;

    // Update profile with relevant changes
    if (changes.name || changes.mobile || changes.countryCode) {
      const profileUpdate = {};
      if (changes.name) profileUpdate.name = changes.name;
      if (changes.mobile) profileUpdate.mobile = changes.mobile;
      if (changes.countryCode) profileUpdate.countryCode = changes.countryCode;

      await UserProfile.findOneAndUpdate(
        { userId },
        {
          ...profileUpdate,
          lastProfileUpdate: new Date()
        },
        { upsert: false }
      );
    }

    console.log(`✅ Updated profile for user: ${userId}`);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Handle user deleted event
 * Clean up user data
 */
const handleUserDeleted = async (data) => {
  try {
    const { userId } = data;

    // Delete user preferences and profile
    await UserPreferences.findOneAndDelete({ userId });
    await UserProfile.findOneAndDelete({ userId });

    console.log(`✅ Cleaned up data for deleted user: ${userId}`);
  } catch (error) {
    console.error('Error cleaning up user data:', error);
    throw error;
  }
};

/**
 * Handle user login event
 * Update login statistics if needed
 */
const handleUserLogin = async (data) => {
  try {
    const { userId, device, ipAddress } = data;

    // Update last login info in profile if needed
    await UserProfile.findOneAndUpdate(
      { userId },
      {
        lastLogin: new Date(),
        lastLoginDevice: device,
        lastLoginIP: ipAddress
      },
      { upsert: false }
    );

    console.log(`✅ Updated login info for user: ${userId}`);
  } catch (error) {
    console.error('Error updating login info:', error);
    throw error;
  }
};

/**
 * Handle user logout event
 * Log session end
 */
const handleUserLogout = async (data) => {
  try {
    const { userId, sessionId } = data;

    console.log(`✅ User logged out: ${userId}, session: ${sessionId}`);
    // Additional logout handling can be added here
  } catch (error) {
    console.error('Error handling logout:', error);
    throw error;
  }
};

/**
 * Handle password changed event
 * Log security event
 */
const handlePasswordChanged = async (data) => {
  try {
    const { userId, changedAt } = data;

    console.log(`✅ Password changed for user: ${userId} at ${changedAt}`);
    // Additional security logging can be added here
  } catch (error) {
    console.error('Error handling password change:', error);
    throw error;
  }
};
