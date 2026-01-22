import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Search,
  Filter,
  Download,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  fetchPriceHistory,
  fetchDistrictPrices,
  fetchStatePrices,
  setCurrentPeriod,
} from '../store/slices/priceSlice';

const PriceDashboard = () => {
  const dispatch = useDispatch();
  const { priceHistory, districtPrices, statePrices, loading, currentPeriod } = useSelector(
    (state) => state.prices
  );

  const [selectedCrop, setSelectedCrop] = useState('tomato');
  const [selectedDistrict, setSelectedDistrict] = useState('pune');
  const [selectedState, setSelectedState] = useState('maharashtra');
  const [showFilters, setShowFilters] = useState(false);
  const [period, setPeriod] = useState('7d');

  const crops = [
    { id: 'tomato', name: 'Tomato', category: 'vegetables' },
    { id: 'potato', name: 'Potato', category: 'vegetables' },
    { id: 'wheat', name: 'Wheat', category: 'grains' },
    { id: 'rice', name: 'Rice', category: 'grains' },
    { id: 'onion', name: 'Onion', category: 'vegetables' },
    { id: 'maize', name: 'Maize', category: 'grains' },
  ];

  const districts = [
    'pune', 'nashik', 'nagpur', 'kolhapur', 'aurangabad',
    'thane', 'mumbai', 'solapur', 'amravati', 'latur'
  ];

  const states = [
    'maharashtra', 'karnataka', 'gujarat', 'madhya pradesh',
    'uttar pradesh', 'rajasthan', 'tamil nadu', 'andhra pradesh'
  ];

  const periods = [
    { value: '1d', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  // Mock data for demonstration
  const mockPriceData = [
    { date: 'Jan 1', district: 42, state: 45, national: 48 },
    { date: 'Jan 2', district: 43, state: 46, national: 48 },
    { date: 'Jan 3', district: 44, state: 47, national: 49 },
    { date: 'Jan 4', district: 43, state: 46, national: 48 },
    { date: 'Jan 5', district: 45, state: 48, national: 50 },
    { date: 'Jan 6', district: 46, state: 49, national: 51 },
    { date: 'Jan 7', district: 47, state: 50, national: 52 },
  ];

  const priceComparison = [
    { location: 'Your Price', price: 45, change: '+5%', trend: 'up' },
    { location: 'District Avg', price: 42, change: '+2%', trend: 'up' },
    { location: 'State Avg', price: 48, change: '-1%', trend: 'down' },
    { location: 'National Avg', price: 50, change: '0%', trend: 'stable' },
  ];

  const marketTrends = [
    { crop: 'Tomato', current: 45, change: '+5%', trend: 'up', volume: 'High' },
    { crop: 'Potato', current: 25, change: '-2%', trend: 'down', volume: 'Medium' },
    { crop: 'Wheat', current: 2200, change: '+3%', trend: 'up', volume: 'High' },
    { crop: 'Rice', current: 3500, change: '0%', trend: 'stable', volume: 'Medium' },
    { crop: 'Onion', current: 35, change: '+8%', trend: 'up', volume: 'Low' },
  ];

  useEffect(() => {
    // Fetch price data when filters change
    if (selectedCrop && selectedDistrict && selectedState) {
      dispatch(fetchPriceHistory({ cropId: selectedCrop, period }));
      dispatch(fetchDistrictPrices({ cropId: selectedCrop, district: selectedDistrict }));
      dispatch(fetchStatePrices({ cropId: selectedCrop, state: selectedState }));
    }
  }, [dispatch, selectedCrop, selectedDistrict, selectedState, period]);

  const handleSetPriceAlert = () => {
    // Implement price alert setting
    alert('Price alert feature coming soon!');
  };

  const handleDownloadData = () => {
    // Implement data download
    alert('Download feature coming soon!');
  };

  const TrendIcon = ({ trend }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Price Dashboard</h1>
          <p className="text-gray-600">
            Real-time crop prices with district and state level comparison
          </p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={handleSetPriceAlert}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Bell className="h-5 w-5 mr-2" />
            Set Price Alert
          </button>
          <button
            onClick={handleDownloadData}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-primary-600 hover:text-primary-700"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Crop
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district.charAt(0).toUpperCase() + district.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state.charAt(0).toUpperCase() + state.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value);
                  dispatch(setCurrentPeriod(e.target.value));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {periods.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Price Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Price Chart */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">
                {selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)} Price Trend
              </h3>
              <p className="text-sm text-gray-500">Last {period}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">₹45/kg</p>
              <p className="text-green-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +5% from yesterday
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockPriceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value) => [`₹${value}/kg`, 'Price']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="district"
                  name="District Price"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="state"
                  name="State Price"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="national"
                  name="National Price"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-6">Price Comparison</h3>
          <div className="space-y-4">
            {priceComparison.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div
                    className={`p-2 rounded-lg mr-3 ${
                      item.location === 'Your Price'
                        ? 'bg-primary-100'
                        : item.location === 'District Avg'
                        ? 'bg-blue-100'
                        : item.location === 'State Avg'
                        ? 'bg-green-100'
                        : 'bg-purple-100'
                    }`}
                  >
                    <TrendIcon trend={item.trend} />
                  </div>
                  <div>
                    <h4 className="font-medium">{item.location}</h4>
                    <p className="text-sm text-gray-500">
                      {item.location === 'Your Price' ? 'Your listed price' : 
                       item.location === 'District Avg' ? `Avg in ${selectedDistrict}` :
                       item.location === 'State Avg' ? `Avg in ${selectedState}` :
                       'National average'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">₹{item.price}/kg</p>
                  <p
                    className={`text-sm ${
                      item.trend === 'up'
                        ? 'text-green-600'
                        : item.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {item.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Trends */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Market Trends</h3>
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search crops..."
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Crop
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  24h Change
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trend
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trading Volume
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {marketTrends.map((crop, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <span className="font-semibold text-green-600">
                          {crop.crop.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{crop.crop}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {crop.current}{crop.crop === 'Wheat' || crop.crop === 'Rice' ? '/ton' : '/kg'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        crop.change.startsWith('+')
                          ? 'text-green-600'
                          : crop.change.startsWith('-')
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {crop.change}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <TrendIcon trend={crop.trend} />
                      <span className="ml-2 capitalize">{crop.trend}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        crop.volume === 'High'
                          ? 'bg-green-100 text-green-800'
                          : crop.volume === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {crop.volume}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={handleSetPriceAlert}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Set Alert
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Prediction */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-6">Price Prediction</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
            <div className="text-blue-600 mb-2">Next 7 Days</div>
            <div className="text-2xl font-bold mb-2">₹48 - ₹52/kg</div>
            <div className="text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Expected to rise by 6-8%
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
            <div className="text-green-600 mb-2">Next 30 Days</div>
            <div className="text-2xl font-bold mb-2">₹50 - ₹55/kg</div>
            <div className="text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Seasonal demand increase
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
            <div className="text-purple-600 mb-2">Market Sentiment</div>
            <div className="text-2xl font-bold mb-2">Bullish</div>
            <div className="text-green-600">
              High demand, low supply in region
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceDashboard;