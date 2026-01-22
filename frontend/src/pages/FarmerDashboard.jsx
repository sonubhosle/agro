import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { fetchCrops } from '../store/slices/cropSlice';

const FarmerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { crops, loading } = useSelector((state) => state.crops);
  const [stats, setStats] = useState({
    totalCrops: 0,
    activeListings: 0,
    totalSales: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    avgPrice: 0,
  });

  const earningsData = [
    { month: 'Jan', earnings: 45000 },
    { month: 'Feb', earnings: 52000 },
    { month: 'Mar', earnings: 48000 },
    { month: 'Apr', earnings: 61000 },
    { month: 'May', earnings: 55000 },
    { month: 'Jun', earnings: 72000 },
  ];

  const cropDistribution = [
    { name: 'Tomato', value: 35, color: '#ef4444' },
    { name: 'Potato', value: 25, color: '#10b981' },
    { name: 'Wheat', value: 20, color: '#f59e0b' },
    { name: 'Rice', value: 15, color: '#3b82f6' },
    { name: 'Onion', value: 5, color: '#8b5cf6' },
  ];

  const recentOrders = [
    {
      id: 1,
      crop: 'Tomato',
      buyer: 'Fresh Mart',
      quantity: '500 kg',
      price: '₹22,500',
      status: 'completed',
      date: '2024-01-15',
    },
    {
      id: 2,
      crop: 'Potato',
      buyer: 'City Supermarket',
      quantity: '1000 kg',
      price: '₹25,000',
      status: 'pending',
      date: '2024-01-16',
    },
    {
      id: 3,
      crop: 'Wheat',
      buyer: 'Flour Mill Co.',
      quantity: '5 ton',
      price: '₹11,000',
      status: 'processing',
      date: '2024-01-17',
    },
  ];

  const priceAlerts = [
    {
      crop: 'Tomato',
      threshold: '₹50/kg',
      current: '₹45/kg',
      condition: 'above',
      active: true,
    },
    {
      crop: 'Potato',
      threshold: '₹20/kg',
      current: '₹25/kg',
      condition: 'below',
      active: true,
    },
  ];

  useEffect(() => {
    dispatch(fetchCrops({ farmer: user?._id }));
  }, [dispatch, user]);

  useEffect(() => {
    if (crops.length > 0) {
      const activeListings = crops.filter((crop) => crop.status === 'active');
      const totalEarnings = crops.reduce(
        (sum, crop) => sum + (crop.soldQuantity || 0) * (crop.price || 0),
        0
      );
      const avgPrice = crops.length > 0 
        ? crops.reduce((sum, crop) => sum + (crop.price || 0), 0) / crops.length
        : 0;

      setStats({
        totalCrops: crops.length,
        activeListings: activeListings.length,
        totalSales: crops.reduce((sum, crop) => sum + (crop.soldQuantity || 0), 0),
        pendingOrders: 3, // This would come from orders API
        totalEarnings,
        avgPrice,
      });
    }
  }, [crops]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your farm today</p>
        </div>
        <Link
          to="/crops/add"
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Crop
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Crops Listed</p>
              <p className="text-2xl font-bold">{stats.totalCrops}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Listings</p>
              <p className="text-2xl font-bold">{stats.activeListings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold">₹{stats.totalEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center mb-6">
            <BarChart3 className="h-6 w-6 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold">Monthly Earnings</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => [`₹${value}`, 'Earnings']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop Distribution */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center mb-6">
            <Package className="h-6 w-6 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold">Crop Distribution</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cropDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cropDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders & Price Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <ShoppingCart className="h-6 w-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold">Recent Orders</h3>
            </div>
            <Link to="/orders" className="text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h4 className="font-medium">{order.crop}</h4>
                  <p className="text-sm text-gray-500">{order.buyer}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{order.price}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Alerts */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold">Price Alerts</h3>
            </div>
            <button className="text-primary-600 hover:text-primary-700">
              + Add Alert
            </button>
          </div>
          <div className="space-y-4">
            {priceAlerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{alert.crop}</h4>
                  <p className="text-sm text-gray-500">
                    Alert when price goes {alert.condition} {alert.threshold}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{alert.current}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      alert.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {alert.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Crops */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold">Your Recent Crops</h3>
          </div>
          <Link to="/crops" className="text-primary-600 hover:text-primary-700">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Crop
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Variety
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {crops.slice(0, 5).map((crop) => (
                <tr key={crop._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {crop.images?.[0] && (
                        <img
                          src={crop.images[0]}
                          alt={crop.name}
                          className="h-10 w-10 rounded-lg object-cover mr-3"
                        />
                      )}
                      <span className="font-medium">{crop.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{crop.variety}</td>
                  <td className="px-4 py-3">{crop.quantity} {crop.unit}</td>
                  <td className="px-4 py-3 font-medium">
                    ₹{crop.price}/{crop.unit === 'ton' ? 'ton' : 'kg'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        crop.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : crop.status === 'sold'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {crop.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;