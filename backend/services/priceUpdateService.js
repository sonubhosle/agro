const CropPrice = require('../models/CropPrice');
const PriceHistory = require('../models/PriceHistory');
const Notification = require('../models/Notification');
const PriceAlert = require('../models/PriceAlert');
const logger = require('../utils/logger');

class PriceUpdateService {
  constructor() {
    this.updateInterval = 3600000; // 1 hour in milliseconds
    this.isUpdating = false;
  }

  // Start automatic price updates
  startAutomaticUpdates() {
    setInterval(() => {
      this.updateAllPrices();
    }, this.updateInterval);

    logger.info('Automatic price updates started');
  }

  // Update all crop prices
  async updateAllPrices() {
    if (this.isUpdating) {
      logger.info('Price update already in progress');
      return;
    }

    this.isUpdating = true;

    try {
      logger.info('Starting batch price update...');

      const cropPrices = await CropPrice.find({});
      const totalPrices = cropPrices.length;
      let updatedCount = 0;
      let alertCount = 0;

      for (const cropPrice of cropPrices) {
        try {
          const updateResult = await this.updateSinglePrice(cropPrice);
          
          if (updateResult.updated) {
            updatedCount++;
          }
          
          if (updateResult.alertsTriggered > 0) {
            alertCount += updateResult.alertsTriggered;
          }

          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          logger.error(`Error updating price for ${cropPrice.cropName} in ${cropPrice.district}:`, error);
        }
      }

      logger.info(`Batch price update completed: ${updatedCount}/${totalPrices} updated, ${alertCount} alerts triggered`);

      // Emit update completion event
      const io = require('../server').io;
      io.emit('batch-price-update-complete', {
        timestamp: new Date(),
        updated: updatedCount,
        total: totalPrices,
        alerts: alertCount
      });

    } catch (error) {
      logger.error('Error in batch price update:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  // Update single crop price
  async updateSinglePrice(cropPrice) {
    try {
      // Save current price to history before updating
      await PriceHistory.create({
        priceId: cropPrice._id,
        price: cropPrice.currentPrice,
        volume: cropPrice.totalVolume,
        date: new Date()
      });

      // Calculate new price based on market factors
      const newPrice = await this.calculateNewPrice(cropPrice);

      // Update crop price
      cropPrice.previousPrice = cropPrice.currentPrice;
      cropPrice.currentPrice = newPrice;
      cropPrice.lastUpdated = new Date();

      // Update volume data (simulate market activity)
      const volumeChange = this.simulateVolumeChange();
      cropPrice.totalVolume = Math.max(0, cropPrice.totalVolume + volumeChange);
      cropPrice.availableVolume = Math.max(0, cropPrice.availableVolume + volumeChange);

      // Update demand and supply scores
      cropPrice.demandScore = this.calculateDemandScore(cropPrice);
      cropPrice.supplyScore = this.calculateSupplyScore(cropPrice);

      // Update weather impact
      cropPrice.weatherImpact = this.getWeatherImpact();
      cropPrice.weatherScore = this.getWeatherScore();

      // Update averages
      await this.updateAverages(cropPrice);

      await cropPrice.save();

      // Check for price alerts
      const alertsTriggered = await this.checkPriceAlerts(cropPrice);

      // Emit real-time update
      const io = require('../server').io;
      io.emit('price-updated', {
        cropName: cropPrice.cropName,
        district: cropPrice.district,
        state: cropPrice.state,
        newPrice: cropPrice.currentPrice,
        oldPrice: cropPrice.previousPrice,
        change: cropPrice.priceChange,
        timestamp: new Date()
      });

      return {
        updated: true,
        alertsTriggered: alertsTriggered.length,
        cropPrice
      };

    } catch (error) {
      logger.error(`Error updating single price ${cropPrice._id}:`, error);
      return {
        updated: false,
        error: error.message
      };
    }
  }

  // Calculate new price based on market factors
  async calculateNewPrice(cropPrice) {
    // Base price change based on historical trend
    const baseChange = this.getBasePriceChange(cropPrice.cropName);
    
    // Demand factor (0.9 to 1.1)
    const demandFactor = 0.9 + (cropPrice.demandScore / 100) * 0.2;
    
    // Supply factor (1.1 to 0.9, inverse of demand)
    const supplyFactor = 1.1 - (cropPrice.supplyScore / 100) * 0.2;
    
    // Seasonal factor
    const seasonalFactor = this.getSeasonalFactor(cropPrice.cropName);
    
    // Weather factor
    const weatherFactor = this.getWeatherFactor(cropPrice.weatherScore);
    
    // Random market fluctuation (-2% to +2%)
    const marketFluctuation = 0.98 + Math.random() * 0.04;
    
    // Calculate new price
    let newPrice = cropPrice.currentPrice * baseChange * demandFactor * 
                   supplyFactor * seasonalFactor * weatherFactor * marketFluctuation;
    
    // Ensure price doesn't go below minimum
    const minPrice = this.getMinimumPrice(cropPrice.cropName);
    newPrice = Math.max(minPrice, newPrice);
    
    // Round to 2 decimal places
    return Math.round(newPrice * 100) / 100;
  }

  // Get base price change based on crop type
  getBasePriceChange(cropName) {
    const trends = {
      'tomato': 1.002, // Slight upward trend
      'potato': 0.998, // Slight downward trend
      'wheat': 1.001,
      'rice': 1.0015,
      'onion': 1.003, // More volatile
      'cotton': 1.0005,
      'sugarcane': 0.999,
      'maize': 1.0008,
      'pulses': 1.002,
      'vegetables': 1.0025,
      'fruits': 1.003
    };
    
    return trends[cropName] || 1.001;
  }

  // Get seasonal factor
  getSeasonalFactor(cropName) {
    const month = new Date().getMonth();
    
    // Simulate seasonal patterns
    const seasonalPatterns = {
      'tomato': [1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.3],
      'potato': [1.0, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0],
      'wheat': [1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9, 1.0, 1.1, 1.2, 1.1],
      'onion': [0.9, 0.8, 0.9, 1.0, 1.1, 1.3, 1.5, 1.4, 1.2, 1.0, 0.9, 0.8]
    };
    
    return seasonalPatterns[cropName]?.[month] || 1.0;
  }

  // Get weather factor
  getWeatherFactor(weatherScore) {
    if (weatherScore > 50) {
      return 1.0 + (weatherScore - 50) / 200; // Good weather: slight increase
    } else {
      return 0.9 + (weatherScore / 500); // Bad weather: decrease
    }
  }

  // Get minimum price for crop
  getMinimumPrice(cropName) {
    const minPrices = {
      'tomato': 15,
      'potato': 10,
      'wheat': 20,
      'rice': 25,
      'onion': 18,
      'cotton': 50,
      'sugarcane': 30,
      'maize': 18,
      'pulses': 40,
      'vegetables': 12,
      'fruits': 30
    };
    
    return minPrices[cropName] || 10;
  }

  // Simulate volume change
  simulateVolumeChange() {
    // Random volume change between -100 and +100 kg
    return Math.floor(Math.random() * 200) - 100;
  }

  // Calculate demand score
  calculateDemandScore(cropPrice) {
    const baseScore = 50;
    const priceTrend = cropPrice.priceChange?.percentage || 0;
    const volumeTrend = cropPrice.totalVolume > cropPrice.previousVolume ? 10 : -10;
    
    // Higher demand when prices are stable or rising slowly
    let demandScore = baseScore;
    if (priceTrend > -2 && priceTrend < 5) demandScore += 20;
    if (priceTrend >= 5) demandScore -= 10; // Too expensive
    
    demandScore += volumeTrend;
    
    // Add random fluctuation
    demandScore += Math.random() * 20 - 10;
    
    return Math.max(0, Math.min(100, demandScore));
  }

  // Calculate supply score
  calculateSupplyScore(cropPrice) {
    // Inverse of demand score, but not exactly
    const demandScore = cropPrice.demandScore || 50;
    const supplyScore = 100 - demandScore;
    
    // Adjust based on available volume
    const volumeRatio = cropPrice.availableVolume / Math.max(1, cropPrice.totalVolume);
    if (volumeRatio > 0.7) supplyScore += 20; // High availability
    if (volumeRatio < 0.3) supplyScore -= 20; // Low availability
    
    return Math.max(0, Math.min(100, supplyScore));
  }

  // Get weather impact
  getWeatherImpact() {
    const impacts = ['positive', 'negative', 'neutral'];
    return impacts[Math.floor(Math.random() * impacts.length)];
  }

  // Get weather score
  getWeatherScore() {
    // Random score between 0 and 100
    return Math.floor(Math.random() * 101);
  }

  // Update price averages
  async updateAverages(cropPrice) {
    try {
      // Get historical data for last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const dailyPrices = await PriceHistory.find({
        priceId: cropPrice._id,
        date: { $gte: twentyFourHoursAgo }
      }).sort('date');

      if (dailyPrices.length > 0) {
        const prices = dailyPrices.map(p => p.price);
        cropPrice.dailyHigh = Math.max(...prices);
        cropPrice.dailyLow = Math.min(...prices);
      }

      // Get weekly average
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const weeklyData = await PriceHistory.aggregate([
        {
          $match: {
            priceId: cropPrice._id,
            date: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: null,
            average: { $avg: '$price' }
          }
        }
      ]);

      if (weeklyData.length > 0) {
        cropPrice.weeklyAverage = weeklyData[0].average;
      }

      // Get monthly average
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const monthlyData = await PriceHistory.aggregate([
        {
          $match: {
            priceId: cropPrice._id,
            date: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: null,
            average: { $avg: '$price' }
          }
        }
      ]);

      if (monthlyData.length > 0) {
        cropPrice.monthlyAverage = monthlyData[0].average;
      }

    } catch (error) {
      logger.error('Error updating averages:', error);
    }
  }

  // Check for price alerts
  async checkPriceAlerts(cropPrice) {
    try {
      if (!cropPrice.previousPrice || cropPrice.priceChange.percentage === 0) {
        return [];
      }

      const alerts = await PriceAlert.find({
        cropName: cropPrice.cropName,
        district: cropPrice.district,
        state: cropPrice.state,
        isActive: true
      });

      const triggeredAlerts = [];

      for (const alert of alerts) {
        const priceData = alert.checkPrice(cropPrice.previousPrice, cropPrice.currentPrice);
        
        if (priceData) {
          await alert.triggerAlert(priceData);
          triggeredAlerts.push({
            alertId: alert._id,
            userId: alert.user,
            ...priceData
          });
        }
      }

      return triggeredAlerts;

    } catch (error) {
      logger.error('Error checking price alerts:', error);
      return [];
    }
  }

  // Update prices from external API (government mandi prices)
  async updateFromExternalAPI() {
    try {
      logger.info('Fetching external price data...');

      // This would connect to government mandi APIs in production
      // For now, we'll simulate external data
      const externalPrices = this.simulateExternalPrices();

      let updatedCount = 0;

      for (const externalPrice of externalPrices) {
        try {
          const cropPrice = await CropPrice.findOne({
            cropName: externalPrice.cropName,
            district: externalPrice.district,
            state: externalPrice.state
          });

          if (cropPrice) {
            // Update with external data
            cropPrice.mandiPrice = externalPrice.price;
            cropPrice.mandiPriceDate = new Date();
            
            // Blend external price with current price (weighted average)
            const blendedPrice = (cropPrice.currentPrice * 0.7) + (externalPrice.price * 0.3);
            cropPrice.currentPrice = blendedPrice;
            
            await cropPrice.save();
            updatedCount++;
          }
        } catch (error) {
          logger.error(`Error updating from external API for ${externalPrice.cropName}:`, error);
        }
      }

      logger.info(`Updated ${updatedCount} prices from external API`);

    } catch (error) {
      logger.error('Error updating from external API:', error);
    }
  }

  // Simulate external price data
  simulateExternalPrices() {
    const crops = ['tomato', 'potato', 'wheat', 'rice', 'onion'];
    const districts = ['Pune', 'Nashik', 'Nagpur', 'Ahmednagar'];
    const states = ['Maharashtra'];
    
    const externalPrices = [];
    
    for (const crop of crops) {
      for (const district of districts) {
        for (const state of states) {
          // Generate price ±20% of average
          const basePrice = this.getBasePrice(crop);
          const variation = 0.8 + Math.random() * 0.4;
          const price = basePrice * variation;
          
          externalPrices.push({
            cropName: crop,
            district,
            state,
            price: Math.round(price * 100) / 100,
            source: 'mandi_api',
            timestamp: new Date()
          });
        }
      }
    }
    
    return externalPrices;
  }

  // Get base price for crop
  getBasePrice(cropName) {
    const basePrices = {
      'tomato': 40,
      'potato': 30,
      'wheat': 25,
      'rice': 40,
      'onion': 35
    };
    
    return basePrices[cropName] || 30;
  }

  // Manual price update (for admin)
  async manualPriceUpdate(cropPriceId, newPrice, reason) {
    try {
      const cropPrice = await CropPrice.findById(cropPriceId);
      
      if (!cropPrice) {
        throw new Error('Crop price not found');
      }

      // Save to history
      await PriceHistory.create({
        priceId: cropPrice._id,
        price: cropPrice.currentPrice,
        volume: cropPrice.totalVolume,
        date: new Date(),
        source: 'manual',
        metadata: { reason, updatedBy: 'admin' }
      });

      // Update price
      cropPrice.previousPrice = cropPrice.currentPrice;
      cropPrice.currentPrice = newPrice;
      cropPrice.lastUpdated = new Date();
      cropPrice.source = 'manual';
      
      await cropPrice.save();

      // Check alerts
      await this.checkPriceAlerts(cropPrice);

      logger.info(`Manual price update for ${cropPrice.cropName}: ${cropPrice.previousPrice} → ${newPrice}`);

      return {
        success: true,
        cropPrice,
        change: cropPrice.priceChange
      };

    } catch (error) {
      logger.error('Error in manual price update:', error);
      throw error;
    }
  }

  // Get price update statistics
  async getUpdateStatistics() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const stats = await PriceHistory.aggregate([
        {
          $match: {
            date: { $gte: twentyFourHoursAgo }
          }
        },
        {
          $facet: {
            totalUpdates: [{ $count: 'count' }],
            bySource: [
              {
                $group: {
                  _id: '$source',
                  count: { $sum: 1 }
                }
              }
            ],
            byHour: [
              {
                $group: {
                  _id: { $hour: '$date' },
                  count: { $sum: 1 },
                  avgPriceChange: { $avg: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]);

      return stats[0];
    } catch (error) {
      logger.error('Error getting update statistics:', error);
      throw error;
    }
  }
}

module.exports = new PriceUpdateService();