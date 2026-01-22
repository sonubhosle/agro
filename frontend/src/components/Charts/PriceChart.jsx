import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';

const PriceChart = ({ data, cropName, period = '7d' }) => {
  const [chartType, setChartType] = useState('line');
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({
    current: 0,
    change: 0,
    percentage: 0,
    high: 0,
    low: 0,
    average: 0,
  });

  useEffect(() => {
    if (data && data.historicalData) {
      // Process data for chart
      const processedData = data.historicalData.map((item, index) => ({
        date: new Date(item.date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        }),
        price: item.price,
        volume: item.volume || 0,
        movingAverage: calculateMovingAverage(data.historicalData, index, 7),
      }));

      setChartData(processedData);

      // Calculate statistics
      const prices = data.historicalData.map(d => d.price);
      const currentPrice = prices[prices.length - 1] || 0;
      const previousPrice = prices[prices.length - 2] || currentPrice;
      const change = currentPrice - previousPrice;
      const percentage = previousPrice ? (change / previousPrice) * 100 : 0;

      setStats({
        current: currentPrice,
        change,
        percentage,
        high: Math.max(...prices),
        low: Math.min(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
      });
    }
  }, [data]);

  const calculateMovingAverage = (data, index, period) => {
    if (index < period - 1) return null;
    
    const slice = data.slice(index - period + 1, index + 1);
    const sum = slice.reduce((total, item) => total + item.price, 0);
    return sum / period;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <div
                  className="h-3 w-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600">{entry.name}:</span>
              </div>
              <span className="font-medium">
                {entry.name === 'price' || entry.name === 'movingAverage'
                  ? formatPrice(entry.value)
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {cropName} Price Trends
          </h2>
          <p className="text-gray-600">
            Last {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'} price movement
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => setChartType('line')}
            className={`px-4 py-2 rounded-lg ${
              chartType === 'line'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-4 py-2 rounded-lg ${
              chartType === 'area'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Area
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Price</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(stats.current)}
              </p>
            </div>
            <FiActivity className="h-8 w-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">24h Change</p>
              <div className="flex items-center">
                {stats.change >= 0 ? (
                  <FiTrendingUp className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <FiTrendingDown className="h-5 w-5 text-red-500 mr-2" />
                )}
                <p
                  className={`text-xl font-bold ${
                    stats.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatPrice(Math.abs(stats.change))}
                </p>
              </div>
              <p
                className={`text-sm ${
                  stats.percentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stats.percentage >= 0 ? '+' : ''}
                {stats.percentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">24h High</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(stats.high)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">24h Low</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(stats.low)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280' }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.2}
                strokeWidth={2}
                name="Price"
              />
              <Area
                type="monotone"
                dataKey="movingAverage"
                stroke="#f59e0b"
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="7-Day MA"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280' }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Price"
              />
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="7-Day MA"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center mt-6">
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          {['7d', '30d', '90d', '1y'].map((p) => (
            <button
              key={p}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === p
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => {/* Handle period change */}}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriceChart;