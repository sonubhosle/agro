const CropPrice = require('../models/CropPrice');
const PriceHistory = require('../models/PriceHistory');
const { catchAsync } = require('../middleware/error');


exports.getAllPrices = catchAsync(async (req, res, next) => {
  const {
    cropName,
    district,
    state,
    marketType,
    page = 1,
    limit = 10,
    sort = '-lastUpdated'
  } = req.query;

  // Build query
  const query = {};

  if (cropName) query.cropName = cropName;
  if (district) query.district = district;
  if (state) query.state = state;
  if (marketType) query.marketType = marketType;

  const skip = (page - 1) * limit;

  const prices = await CropPrice.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort(sort);

  const total = await CropPrice.countDocuments(query);

  res.status(200).json({
    success: true,
    count: prices.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: prices
  });
});


exports.getPrice = catchAsync(async (req, res, next) => {
  const price = await CropPrice.findById(req.params.id);

  if (!price) {
    return res.status(404).json({
      success: false,
      message: 'Price not found'
    });
  }

  // Get price history
  const history = await PriceHistory.find({ priceId: price._id })
    .sort('-date')
    .limit(30);

  const priceData = price.toObject();
  priceData.history = history;

  res.status(200).json({
    success: true,
    data: priceData
  });
});


exports.getPriceByLocation = catchAsync(async (req, res, next) => {
  const { cropName, district, state, variety, qualityGrade } = req.query;

  if (!cropName || !district || !state) {
    return res.status(400).json({
      success: false,
      message: 'Crop name, district, and state are required'
    });
  }

  const query = {
    cropName,
    district,
    state
  };

  if (variety) query.variety = variety;
  if (qualityGrade) query.qualityGrade = qualityGrade;

  const price = await CropPrice.findOne(query);

  if (!price) {
    return res.status(404).json({
      success: false,
      message: 'Price not found for the specified location and crop'
    });
  }

  // Get historical data for trends
  const historicalData = await PriceHistory.aggregate([
    {
      $match: {
        priceId: price._id,
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
        },
        averagePrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        volume: { $sum: '$volume' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const priceData = price.toObject();
  priceData.trends = historicalData;

  res.status(200).json({
    success: true,
    data: priceData
  });
});

exports.getDistrictPrices = catchAsync(async (req, res, next) => {
  const { district } = req.params;
  const { cropName, state } = req.query;

  const query = { district };
  if (cropName) query.cropName = cropName;
  if (state) query.state = state;

  const prices = await CropPrice.find(query)
    .sort('-lastUpdated')
    .limit(50);

  // Group by crop
  const groupedPrices = prices.reduce((acc, price) => {
    if (!acc[price.cropName]) {
      acc[price.cropName] = [];
    }
    acc[price.cropName].push(price);
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    district,
    count: prices.length,
    data: groupedPrices
  });
});

exports.getStatePrices = catchAsync(async (req, res, next) => {
  const { state } = req.params;
  const { cropName } = req.query;

  const query = { state };
  if (cropName) query.cropName = cropName;

  const prices = await CropPrice.find(query)
    .sort('-lastUpdated')
    .limit(100);

  // Calculate state averages
  const stateAverages = await CropPrice.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$cropName',
        averagePrice: { $avg: '$currentPrice' },
        minPrice: { $min: '$currentPrice' },
        maxPrice: { $max: '$currentPrice' },
        totalVolume: { $sum: '$totalVolume' },
        districtCount: { $addToSet: '$district' }
      }
    },
    {
      $project: {
        averagePrice: { $round: ['$averagePrice', 2] },
        minPrice: 1,
        maxPrice: 1,
        totalVolume: 1,
        districtCount: { $size: '$districtCount' }
      }
    },
    { $sort: { averagePrice: -1 } }
  ]);

  res.status(200).json({
    success: true,
    state,
    count: prices.length,
    averages: stateAverages,
    data: prices
  });
});


exports.getPriceTrends = catchAsync(async (req, res, next) => {
  const { cropName, district, state, days = 7 } = req.query;

  if (!cropName) {
    return res.status(400).json({
      success: false,
      message: 'Crop name is required'
    });
  }

  const query = { cropName };
  if (district) query.district = district;
  if (state) query.state = state;

  // Find the price record
  const priceRecord = await CropPrice.findOne(query);

  if (!priceRecord) {
    return res.status(404).json({
      success: false,
      message: 'Price data not found'
    });
  }

  // Get historical data
  const historicalData = await PriceHistory.find({
    priceId: priceRecord._id,
    date: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  })
    .sort('date')
    .select('date price volume -_id');

  // Calculate trends
  const trends = {
    currentPrice: priceRecord.currentPrice,
    priceChange: priceRecord.priceChange,
    dailyHigh: priceRecord.dailyHigh,
    dailyLow: priceRecord.dailyLow,
    weeklyAverage: priceRecord.weeklyAverage,
    monthlyAverage: priceRecord.monthlyAverage,
    historicalData
  };

  // Calculate moving averages
  if (historicalData.length >= 7) {
    const prices = historicalData.map(d => d.price);
    
    // 7-day moving average
    const sevenDayMA = [];
    for (let i = 6; i < prices.length; i++) {
      const avg = prices.slice(i - 6, i + 1).reduce((a, b) => a + b) / 7;
      sevenDayMA.push(avg);
    }
    trends.movingAverages = {
      sevenDay: sevenDayMA[sevenDayMA.length - 1] || null
    };

    // Calculate trend direction
    if (prices.length >= 2) {
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const trendPercentage = ((lastPrice - firstPrice) / firstPrice) * 100;
      trends.trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'stable';
      trends.trendPercentage = Math.abs(trendPercentage).toFixed(2);
    }
  }

  res.status(200).json({
    success: true,
    data: trends
  });
});

exports.updatePrice = catchAsync(async (req, res, next) => {
  const price = await CropPrice.findById(req.params.id);

  if (!price) {
    return res.status(404).json({
      success: false,
      message: 'Price not found'
    });
  }

  // Save current price to history before updating
  await PriceHistory.create({
    priceId: price._id,
    price: price.currentPrice,
    volume: price.totalVolume,
    date: new Date()
  });

  // Update price
  const updateFields = [
    'currentPrice', 'totalVolume', 'availableVolume',
    'demandScore', 'supplyScore', 'marketType',
    'weatherImpact', 'weatherScore', 'mandiPrice',
    'alertThresholds'
  ];

  updateFields.forEach(field => {
    if (req.body[field] !== undefined) {
      price[field] = req.body[field];
    }
  });

  // If current price is updated, set previous price
  if (req.body.currentPrice !== undefined) {
    price.previousPrice = price.currentPrice;
  }

  await price.save();

  // Emit real-time update
  const io = require('../server').io;
  io.emit('price-updated', {
    cropName: price.cropName,
    district: price.district,
    state: price.state,
    newPrice: price.currentPrice,
    change: price.priceChange,
    timestamp: new Date()
  });

  res.status(200).json({
    success: true,
    message: 'Price updated successfully',
    data: price
  });
});


exports.createPrice = catchAsync(async (req, res, next) => {
  const price = await CropPrice.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Price created successfully',
    data: price
  });
});

exports.deletePrice = catchAsync(async (req, res, next) => {
  const price = await CropPrice.findById(req.params.id);

  if (!price) {
    return res.status(404).json({
      success: false,
      message: 'Price not found'
    });
  }

  // Delete associated history
  await PriceHistory.deleteMany({ priceId: price._id });

  await price.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Price deleted successfully'
  });
});

exports.getPriceComparison = catchAsync(async (req, res, next) => {
  const { cropName, variety, qualityGrade } = req.query;

  if (!cropName) {
    return res.status(400).json({
      success: false,
      message: 'Crop name is required'
    });
  }

  const query = { cropName };
  if (variety) query.variety = variety;
  if (qualityGrade) query.qualityGrade = qualityGrade;

  const prices = await CropPrice.find(query)
    .sort('currentPrice')
    .limit(20);

  // Calculate statistics
  const priceValues = prices.map(p => p.currentPrice);
  const averagePrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);

  // Group by state
  const byState = prices.reduce((acc, price) => {
    if (!acc[price.state]) {
      acc[price.state] = [];
    }
    acc[price.state].push(price);
    return acc;
  }, {});

  // Calculate state averages
  const stateAverages = Object.entries(byState).map(([state, statePrices]) => {
    const statePriceValues = statePrices.map(p => p.currentPrice);
    return {
      state,
      averagePrice: statePriceValues.reduce((a, b) => a + b, 0) / statePriceValues.length,
      minPrice: Math.min(...statePriceValues),
      maxPrice: Math.max(...statePriceValues),
      count: statePrices.length
    };
  });

  res.status(200).json({
    success: true,
    statistics: {
      average: averagePrice.toFixed(2),
      min: minPrice,
      max: maxPrice,
      range: (maxPrice - minPrice).toFixed(2),
      count: prices.length
    },
    stateAverages,
    data: prices
  });
});


exports.getPricePredictions = catchAsync(async (req, res, next) => {
  const { cropName, district, state, days = 7 } = req.query;

  if (!cropName || !district || !state) {
    return res.status(400).json({
      success: false,
      message: 'Crop name, district, and state are required'
    });
  }

  const price = await CropPrice.findOne({
    cropName,
    district,
    state
  });

  if (!price) {
    return res.status(404).json({
      success: false,
      message: 'Price data not found'
    });
  }

  // Get historical data for prediction
  const historicalData = await PriceHistory.find({
    priceId: price._id,
    date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
  })
    .sort('date')
    .select('date price volume');

  if (historicalData.length < 7) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient historical data for prediction'
    });
  }

  // Simple prediction algorithm (in production, use ML model)
  const predictions = generatePredictions(historicalData, days);

  res.status(200).json({
    success: true,
    currentPrice: price.currentPrice,
    predictionDays: days,
    confidence: 75, // Mock confidence score
    predictions,
    disclaimer: 'Predictions are based on historical trends and may not be accurate. Always verify with current market data.'
  });
});

function generatePredictions(historicalData, days) {
  const prices = historicalData.map(d => d.price);
  
  // Calculate moving averages
  const ma7 = calculateMovingAverage(prices, 7);
  const ma14 = calculateMovingAverage(prices, 14);
  
  // Simple trend detection
  const recentTrend = ma7[ma7.length - 1] - ma7[ma7.length - 2];
  const volatility = calculateVolatility(prices.slice(-14));
  
  // Generate predictions
  const predictions = [];
  let lastPrice = prices[prices.length - 1];
  
  for (let i = 1; i <= days; i++) {
    // Simple prediction based on trend and volatility
    const dailyChange = recentTrend + (Math.random() - 0.5) * volatility * 2;
    const predictedPrice = lastPrice + dailyChange;
    
    predictions.push({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      price: Math.max(predictedPrice, lastPrice * 0.5), // Don't drop below 50%
      confidence: Math.max(60, 100 - i * 5) // Confidence decreases with time
    });
    
    lastPrice = predictedPrice;
  }
  
  return predictions;
}

function calculateMovingAverage(prices, period) {
  const ma = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b);
    ma.push(sum / period);
  }
  return ma;
}

function calculateVolatility(prices) {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}