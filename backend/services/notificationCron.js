const cron = require('cron');
const Notification = require('../models/Notification');
const CropPrice = require('../models/CropPrice');
const PriceAlert = require('../models/PriceAlert');
const NotificationService = require('../utils/notificationService');
const PriceCalculator = require('../utils/priceCalculator');
const logger = require('../utils/logger');

class NotificationCron {
  constructor() {
    this.jobs = [];
    this.initializeJobs();
  }

  initializeJobs() {
    // 1. Price alert checker - runs every 30 minutes
    const priceAlertJob = new cron.CronJob('*/30 * * * *', () => {
      this.checkPriceAlerts();
    });
    
    // 2. Pending notification retry - runs every 15 minutes
    const retryJob = new cron.CronJob('*/15 * * * *', () => {
      this.retryFailedNotifications();
    });
    
    // 3. Cleanup old notifications - runs daily at 2 AM
    const cleanupJob = new cron.CronJob('0 2 * * *', () => {
      this.cleanupOldNotifications();
    });
    
    // 4. Daily summary notifications - runs daily at 9 AM
    const summaryJob = new cron.CronJob('0 9 * * *', () => {
      this.sendDailySummaries();
    });
    
    // 5. Price trend notifications - runs weekly on Monday at 10 AM
    const trendJob = new cron.CronJob('0 10 * * 1', () => {
      this.sendWeeklyTrends();
    });
    
    this.jobs = [priceAlertJob, retryJob, cleanupJob, summaryJob, trendJob];
  }

  async checkPriceAlerts() {
    try {
      logger.info('Checking price alerts...');
      
      // Get all active crop prices updated in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentPrices = await CropPrice.find({
        lastUpdated: { $gte: oneHourAgo }
      });
      
      let totalAlertsTriggered = 0;
      
      for (const price of recentPrices) {
        if (!price.previousPrice || price.priceChange.percentage === 0) {
          continue;
        }
        
        // Check all alerts for this crop and location
        const triggered = await PriceAlert.checkAllAlerts(price);
        totalAlertsTriggered += triggered.length;
        
        // Log triggered alerts
        if (triggered.length > 0) {
          logger.info(`Triggered ${triggered.length} alerts for ${price.cropName} in ${price.district}`);
        }
      }
      
      logger.info(`Price alert check completed. Triggered ${totalAlertsTriggered} alerts.`);
    } catch (error) {
      logger.error('Error checking price alerts:', error);
    }
  }

  async retryFailedNotifications() {
    try {
      logger.info('Retrying failed notifications...');
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Find failed notifications that can be retried
      const failedNotifications = await Notification.find({
        status: 'failed',
        retryCount: { $lt: 3 },
        lastRetryAt: { $lt: oneHourAgo }
      }).limit(100);
      
      let retried = 0;
      let successful = 0;
      
      for (const notification of failedNotifications) {
        try {
          retried++;
          
          // Get user for notification preferences
          const User = require('../models/User');
          const user = await User.findById(notification.user);
          
          if (!user) {
            logger.warn(`User not found for notification ${notification._id}`);
            continue;
          }
          
          // Retry sending notification
          await NotificationService.sendNotification(notification, user);
          successful++;
          
          logger.info(`Retried notification ${notification._id} successfully`);
        } catch (retryError) {
          logger.error(`Failed to retry notification ${notification._id}:`, retryError);
          
          // Update retry count
          notification.retryCount += 1;
          notification.lastRetryAt = new Date();
          await notification.save();
        }
      }
      
      logger.info(`Retried ${retried} notifications, ${successful} successful`);
    } catch (error) {
      logger.error('Error retrying failed notifications:', error);
    }
  }

  async cleanupOldNotifications() {
    try {
      logger.info('Cleaning up old notifications...');
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Delete notifications older than 30 days
      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        'channels.inApp.read': true
      });
      
      logger.info(`Cleaned up ${result.deletedCount} old notifications`);
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
    }
  }

  async sendDailySummaries() {
    try {
      logger.info('Sending daily summaries...');
      
      // Get all active users
      const User = require('../models/User');
      const users = await User.find({ isActive: true }).limit(1000); // Batch size
      
      for (const user of users) {
        try {
          // Skip if user doesn't want daily summaries
          if (!user.notificationPreferences?.email?.promotions) {
            continue;
          }
          
          // Get user's activities for yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let summaryData = {};
          
          if (user.role === 'farmer') {
            // Farmer summary
            const Crop = require('../models/Crop');
            const Order = require('../models/Order');
            
            const [cropStats, orderStats, priceAlerts] = await Promise.all([
              // Crops added yesterday
              Crop.countDocuments({
                farmer: user._id,
                createdAt: { $gte: yesterday, $lt: today }
              }),
              
              // Orders received yesterday
              Order.countDocuments({
                farmer: user._id,
                createdAt: { $gte: yesterday, $lt: today }
              }),
              
              // Price alerts triggered yesterday
              PriceAlert.countDocuments({
                user: user._id,
                lastTriggered: { $gte: yesterday, $lt: today }
              })
            ]);
            
            summaryData = {
              type: 'farmer',
              cropsAdded: cropStats,
              ordersReceived: orderStats,
              priceAlerts: priceAlerts
            };
            
          } else if (user.role === 'buyer') {
            // Buyer summary
            const Order = require('../models/Order');
            
            const [ordersPlaced, priceAlerts] = await Promise.all([
              // Orders placed yesterday
              Order.countDocuments({
                buyer: user._id,
                createdAt: { $gte: yesterday, $lt: today }
              }),
              
              // Price alerts triggered yesterday
              PriceAlert.countDocuments({
                user: user._id,
                lastTriggered: { $gte: yesterday, $lt: today }
              })
            ]);
            
            summaryData = {
              type: 'buyer',
              ordersPlaced,
              priceAlerts
            };
          }
          
          // Send email summary
          const EmailService = require('../utils/emailService');
          await EmailService.sendEmail(
            user.email,
            'Your Daily Marketplace Summary',
            'daily-summary',
            {
              name: user.fullName,
              date: yesterday.toLocaleDateString('en-IN'),
              ...summaryData
            }
          );
          
          logger.info(`Sent daily summary to ${user.email}`);
          
        } catch (userError) {
          logger.error(`Error sending summary to ${user.email}:`, userError);
        }
      }
      
      logger.info('Daily summaries sent successfully');
    } catch (error) {
      logger.error('Error sending daily summaries:', error);
    }
  }

  async sendWeeklyTrends() {
    try {
      logger.info('Sending weekly price trends...');
      
      // Get users with price alert preferences
      const User = require('../models/User');
      const users = await User.find({
        isActive: true,
        'notificationPreferences.email.promotions': true
      }).limit(500);
      
      for (const user of users) {
        try {
          // Get user's subscribed crops
          const PriceAlert = require('../models/PriceAlert');
          const userAlerts = await PriceAlert.find({
            user: user._id,
            isActive: true
          }).distinct('cropName');
          
          if (userAlerts.length === 0) {
            continue;
          }
          
          // Get weekly trends for user's crops
          const weeklyTrends = [];
          
          for (const cropName of userAlerts.slice(0, 3)) { // Limit to top 3 crops
            // Get price data for the last 7 days
            const CropPrice = require('../models/CropPrice');
            const prices = await CropPrice.find({
              cropName,
              district: user.address.district,
              state: user.address.state
            }).sort('-lastUpdated').limit(7);
            
            if (prices.length >= 2) {
              const firstPrice = prices[prices.length - 1].currentPrice;
              const lastPrice = prices[0].currentPrice;
              const change = ((lastPrice - firstPrice) / firstPrice) * 100;
              
              weeklyTrends.push({
                cropName,
                startPrice: firstPrice,
                endPrice: lastPrice,
                change: change.toFixed(2),
                direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
              });
            }
          }
          
          if (weeklyTrends.length > 0) {
            // Send weekly trends email
            const EmailService = require('../utils/emailService');
            await EmailService.sendEmail(
              user.email,
              'Weekly Crop Price Trends',
              'weekly-trends',
              {
                name: user.fullName,
                location: `${user.address.district}, ${user.address.state}`,
                trends: weeklyTrends
              }
            );
            
            logger.info(`Sent weekly trends to ${user.email}`);
          }
          
        } catch (userError) {
          logger.error(`Error sending trends to ${user.email}:`, userError);
        }
      }
      
      logger.info('Weekly trends sent successfully');
    } catch (error) {
      logger.error('Error sending weekly trends:', error);
    }
  }

  start() {
    this.jobs.forEach(job => job.start());
    logger.info('Notification cron jobs started');
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    logger.info('Notification cron jobs stopped');
  }
}

module.exports = new NotificationCron();