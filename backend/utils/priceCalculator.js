class PriceCalculator {
  // Calculate market price based on various factors
  static calculateMarketPrice(basePrice, factors) {
    let price = basePrice;

    // Apply demand factor (0.8 to 1.2)
    if (factors.demand) {
      const demandFactor = 0.8 + (factors.demand / 100) * 0.4;
      price *= demandFactor;
    }

    // Apply supply factor (0.8 to 1.2)
    if (factors.supply) {
      const supplyFactor = 1.2 - (factors.supply / 100) * 0.4;
      price *= supplyFactor;
    }

    // Apply seasonal factor
    if (factors.seasonalFactor) {
      price *= factors.seasonalFactor;
    }

    // Apply quality multiplier
    if (factors.qualityGrade) {
      const qualityMultipliers = {
        'Premium': 1.3,
        'A': 1.2,
        'Organic': 1.25,
        'B': 1.0,
        'C': 0.8
      };
      price *= qualityMultipliers[factors.qualityGrade] || 1.0;
    }

    // Apply location premium/discount
    if (factors.locationFactor) {
      price *= factors.locationFactor;
    }

    // Apply transportation cost
    if (factors.transportationCost) {
      price += factors.transportationCost;
    }

    // Round to 2 decimal places
    return Math.round(price * 100) / 100;
  }

  // Calculate price trend
  static calculateTrend(prices) {
    if (prices.length < 2) {
      return { direction: 'stable', percentage: 0 };
    }

    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;

    let direction;
    if (percentageChange > 5) {
      direction = 'sharp_increase';
    } else if (percentageChange > 1) {
      direction = 'increase';
    } else if (percentageChange < -5) {
      direction = 'sharp_decrease';
    } else if (percentageChange < -1) {
      direction = 'decrease';
    } else {
      direction = 'stable';
    }

    return {
      direction,
      percentage: Math.round(percentageChange * 100) / 100,
      firstPrice,
      lastPrice,
      change: lastPrice - firstPrice
    };
  }

  // Calculate moving averages
  static calculateMovingAverages(prices, periods = [7, 14, 30]) {
    const result = {};

    periods.forEach(period => {
      if (prices.length >= period) {
        const ma = [];
        for (let i = period - 1; i < prices.length; i++) {
          const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b);
          ma.push(sum / period);
        }
        result[`ma${period}`] = ma;
      }
    });

    return result;
  }

  // Calculate price volatility
  static calculateVolatility(prices) {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

    return Math.round(volatility * 100 * 100) / 100; // Return as percentage
  }

  // Calculate support and resistance levels
  static calculateSupportResistance(prices, lookback = 20) {
    if (prices.length < lookback) {
      return { support: null, resistance: null };
    }

    const recentPrices = prices.slice(-lookback);
    const support = Math.min(...recentPrices);
    const resistance = Math.max(...recentPrices);

    return {
      support: Math.round(support * 100) / 100,
      resistance: Math.round(resistance * 100) / 100,
      range: Math.round((resistance - support) * 100) / 100
    };
  }

  // Calculate fair price based on multiple factors
  static calculateFairPrice(cropData, marketData) {
    const factors = {
      // Base price from farmer
      basePrice: cropData.pricePerUnit,
      
      // Market demand (0-100)
      demand: marketData.demandScore || 50,
      
      // Market supply (0-100)
      supply: marketData.supplyScore || 50,
      
      // Quality grade
      qualityGrade: cropData.qualityGrade,
      
      // Seasonal factor (0.8-1.2)
      seasonalFactor: this.getSeasonalFactor(cropData.name),
      
      // Location factor (based on district/state)
      locationFactor: this.getLocationFactor(cropData.location),
      
      // Transportation cost
      transportationCost: this.calculateTransportationCost(cropData.location, marketData.avgDistance)
    };

    return this.calculateMarketPrice(factors.basePrice, factors);
  }

  static getSeasonalFactor(cropName) {
    const seasonalFactors = {
      'tomato': { '01': 1.2, '02': 1.1, '03': 1.0, '04': 0.9, '05': 0.8, '06': 0.8, '07': 0.9, '08': 1.0, '09': 1.1, '10': 1.2, '11': 1.3, '12': 1.3 },
      'potato': { '01': 1.0, '02': 1.0, '03': 1.1, '04': 1.2, '05': 1.3, '06': 1.2, '07': 1.1, '08': 1.0, '09': 0.9, '10': 0.8, '11': 0.9, '12': 1.0 },
      'wheat': { '01': 1.1, '02': 1.2, '03': 1.3, '04': 1.2, '05': 1.1, '06': 1.0, '07': 0.9, '08': 0.9, '09': 1.0, '10': 1.1, '11': 1.2, '12': 1.1 },
      'rice': { '01': 1.0, '02': 1.0, '03': 1.0, '04': 1.1, '05': 1.2, '06': 1.3, '07': 1.2, '08': 1.1, '09': 1.0, '10': 1.0, '11': 1.0, '12': 1.0 }
    };

    const month = new Date().getMonth() + 1;
    const monthKey = month.toString().padStart(2, '0');
    
    return seasonalFactors[cropName]?.[monthKey] || 1.0;
  }

  static getLocationFactor(location) {
    // In production, this would use actual location data
    // For now, return random factor between 0.9 and 1.1
    return 0.9 + Math.random() * 0.2;
  }

  static calculateTransportationCost(location, avgDistance) {
    // Basic transportation cost calculation
    const baseCostPerKm = 2; // ₹2 per km per kg
    const distance = avgDistance || 50; // Default 50km
    
    return (distance * baseCostPerKm) / 100; // Cost per kg
  }
}

module.exports = PriceCalculator;