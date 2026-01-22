const admin = require('firebase-admin');
const EmailService = require('./emailService');
const SMSService = require('./smsService');

class NotificationService {
  constructor() {
    this.firebaseAvailable = false;
    
    try {
      // Check if Firebase credentials exist
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // Validate credentials
      if (!projectId || projectId === 'farmer-df4dc') {
        console.log('⚠️  Firebase project ID not properly configured');
        return;
      }
      
      if (!clientEmail || !clientEmail.includes('@')) {
        console.log('⚠️  Firebase client email not properly configured');
        return;
      }
      
      if (!privateKey || !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.log('⚠️  Firebase private key not properly formatted');
        return;
      }
      
      // Fix private key formatting
      const formattedPrivateKey = privateKey
        .replace(/\\n/g, '\n')  // Replace escaped newlines
        .replace(/"/g, '')      // Remove quotes if any
        .trim();
      
      // Initialize Firebase
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey
          })
        });
      }
      
      this.firebaseAvailable = true;
      console.log('✅ Firebase initialized successfully');
      
    } catch (error) {
      console.warn('❌ Firebase initialization failed:', error.message);
      console.log('Continuing without Firebase push notifications...');
      this.firebaseAvailable = false;
    }
  }

  async sendNotification(notification, user) {
    try {
      const results = {
        email: null,
        sms: null,
        push: null
      };

      // Send email if enabled
      if (user.notificationPreferences?.email?.[notification.type]) {
        results.email = await this.sendEmail(notification, user);
      }

      // Send SMS if enabled
      if (user.notificationPreferences?.sms?.[notification.type]) {
        results.sms = await this.sendSMS(notification, user);
      }

      // Send push notification if enabled
      if (user.notificationPreferences?.push?.[notification.type]) {
        results.push = await this.sendPush(notification, user);
      }

      return { 
        success: true, 
        results,
        message: 'Notification processed' 
      };
      
    } catch (error) {
      console.error('Error sending notification:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async sendEmail(notification, user) {
    try {
      let subject, template, data;

      switch (notification.type) {
        case 'price_alert':
          subject = `Price ${notification.data?.changeType === 'increase' ? 'Increased' : 'Decreased'} - ${notification.data?.cropName}`;
          template = 'price-alert';
          data = {
            name: user.fullName,
            cropName: notification.data?.cropName,
            changeType: notification.data?.changeType,
            changePercentage: notification.data?.percentageChange,
            currentPrice: notification.data?.currentPrice,
            previousPrice: notification.data?.previousPrice,
            actionUrl: notification.data?.actionUrl
          };
          break;

        case 'order_update':
          subject = `Order Update - ${notification.data?.orderNumber || 'Order'}`;
          template = 'order-update';
          data = {
            name: user.fullName,
            orderId: notification.data?.orderNumber,
            status: notification.data?.status,
            message: notification.message,
            actionUrl: notification.data?.actionUrl
          };
          break;

        case 'payment':
          subject = `Payment ${notification.data?.status} - ${notification.data?.reference}`;
          template = 'payment-notification';
          data = {
            name: user.fullName,
            amount: notification.data?.amount,
            status: notification.data?.status,
            reference: notification.data?.reference,
            actionUrl: notification.data?.actionUrl
          };
          break;

        default:
          subject = notification.title;
          template = 'generic';
          data = {
            name: user.fullName,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.data?.actionUrl
          };
      }

      await EmailService.sendEmail(user.email, subject, template, data);
      return { success: true };
    } catch (error) {
      console.error('Error sending email notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendSMS(notification, user) {
    try {
      let message;

      switch (notification.type) {
        case 'price_alert':
          message = `Price ${notification.data?.changeType} alert: ${notification.data?.cropName} price changed by ${notification.data?.percentageChange}%`;
          break;

        case 'order_update':
          message = `Order ${notification.data?.orderNumber} status: ${notification.data?.status}`;
          break;

        case 'payment':
          message = `Payment ${notification.data?.status}: ₹${notification.data?.amount} for ${notification.data?.reference}`;
          break;

        default:
          message = `${notification.title}: ${notification.message}`;
      }

      await SMSService.sendSMS(user.phone, message);
      return { success: true };
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPush(notification, user) {
    if (!this.firebaseAvailable) {
      console.log('📱 Firebase not available, skipping push notification');
      return { success: false, error: 'Firebase not available' };
    }

    try {
      // Get user's FCM tokens from database
      const User = require('../models/User');
      const dbUser = await User.findById(user._id).select('fcmTokens');
      
      if (!dbUser?.fcmTokens || dbUser.fcmTokens.length === 0) {
        console.log('📱 No FCM tokens found for user:', user._id);
        return { success: false, error: 'No FCM tokens found' };
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.message
        },
        data: {
          type: notification.type,
          ...notification.data
        },
        tokens: dbUser.fcmTokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      // Remove failed tokens
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(dbUser.fcmTokens[idx]);
        }
      });

      if (failedTokens.length > 0) {
        await User.findByIdAndUpdate(user._id, {
          $pull: { fcmTokens: { $in: failedTokens } }
        });
      }

      return { 
        success: true, 
        sent: response.successCount,
        failed: response.failureCount
      };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if Firebase is available
  isFirebaseAvailable() {
    return this.firebaseAvailable;
  }
}

module.exports = new NotificationService();