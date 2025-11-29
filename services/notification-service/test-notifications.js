import dotenv from 'dotenv';
import {
  sendEmailNotification
} from './src/services/emailService.js';
import { createInAppNotification } from './src/services/inAppService.js';
import { compileTemplate } from './src/utils/templateUtils.js';

dotenv.config();

async function testNotifications() {
  console.log('🔔 Testing Notification Service...\n');

  try {
    // Test email notification
    console.log('1. Testing Email Notification...');
    try {
      const emailResult = await sendEmailNotification({
        userId: 'test-user-123',
        recipient: 'test@example.com',
        template: 'welcome',
        templateData: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        category: 'account'
      });
      console.log('✅ Email notification sent:', emailResult);
    } catch (error) {
      console.log('⚠️ Email notification failed (expected if no provider configured):', error.message);
    }

    // Test in-app notification
    console.log('\n2. Testing In-App Notification...');
    try {
      const inAppResult = await createInAppNotification({
        userId: 'test-user-123',
        title: 'Welcome to MedicineFinder!',
        message: 'Thank you for joining our platform. Start exploring medicines and pharmacies nearby.',
        category: 'account',
        actionUrl: '/dashboard',
        actionText: 'Go to Dashboard'
      });
      console.log('✅ In-app notification created:', inAppResult);
    } catch (error) {
      console.log('❌ In-app notification failed:', error.message);
    }

    // Test template compilation
    console.log('\n5. Testing Template Compilation...');
    const template = 'Hello {{name}}, welcome to {{appName}}!';
    const compiled = compileTemplate(template, {
      name: 'Alice',
      appName: 'MedicineFinder'
    });
    console.log('✅ Template compiled:', compiled);

    console.log('\n🎉 Notification service testing completed!');
    console.log('Note: Email/SMS/Push tests may fail if providers are not configured.');
    console.log('This is expected in development environment.');

  } catch (error) {
    console.error('❌ Notification testing failed:', error);
    process.exit(1);
  }
}

// Run the test
testNotifications();
