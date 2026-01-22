import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Users,
  Package,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Filter,
  Download,
  Shield,
  Activity,
  Calendar,
} from 'lucide-react';
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

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');

  // Mock data - in real app, this would come from API
  const stats = {
    totalUsers: 1254,
    totalFarmers: 423,
    totalBuyers: 831,
    totalCrops: 2456,
    activeListings: 892,
    totalOrders: 1542,
    pendingOrders: 23,
    completedOrders: 1489,
    totalRevenue: 12560000,
    disputeCount: 7,
  };

  const revenueData = [
    { month: 'Jan', revenue: 980000 },
    { month: 'Feb', revenue: 1020000 },
    { month: 'Mar', revenue: 1150000 },
    { month: 'Apr', revenue: 1080000 },
    { month: 'May', revenue: 1250000 },
    { month: 'Jun', revenue: 1420000 },
  ];

  const userGrowthData = [
    { month: 'Jan', farmers: 120, buyers: 210 },
    { month: 'Feb', farmers: 145, buyers: 265 },
    { month: 'Mar', farmers: 178, buyers: 312 },
    { month: 'Apr', farmers: 210, buyers: 365 },
    { month: 'May', farmers: 256, buyers: 412 },
    { month: 'Jun', farmers: 298, buyers: 478 },
  ];

  const cropDistributionData = [
    { name: 'Vegetables', value: 35, color: '#10b981' },
    { name: 'Grains', value: 25, color: '#f59e0b' },
    { name: 'Fruits', value: 20, color: '#ef4444' },
    { name: 'Spices', value: 15, color: '#8b5cf6' },
    { name: 'Others', value: 5, color: '#3b82f6' },
  ];

  const recentActivities = [
    { id: 1, user: 'John Doe', action: 'Registered as Farmer', time: '10 min ago', type: 'user' },
    { id: 2, user: 'Fresh Mart', action: 'Placed order #ORD-1234', time: '25 min ago', type: 'order' },
    { id: 3, user: 'Green Valley Farm', action: 'Added new crop listing', time: '1 hour ago', type: 'crop' },
    { id: 4, user: 'City Supermarket', action: 'Completed payment for order', time: '2 hours ago', type: 'payment' },
    { id: 5, user: 'FarmTech Solutions', action: 'Reported issue resolved', time: '3 hours ago', type: 'issue' },
  ];

  const pendingVerifications = [
    { id: 1, name: 'Rajesh Kumar', type: 'Farmer', submitted: '2 days ago', docs: 3 },
    { id: 2, name: 'Fresh Foods Ltd', type: 'Buyer', submitted: '1 day ago', docs: 2 },
    { id: 3, name: 'Green Farms', type: 'Farmer', submitted: '5 hours ago', docs: 4 },
  ];

  const recentOrders = [
    { id: 'ORD-1234', farmer: 'Green Valley', buyer: 'Fresh Mart', amount: '₹45,000', status: 'delivered', date: '2024-01-15' },
    { id: 'ORD-1235', farmer: 'Sunrise Farms', buyer: 'City Mart', amount: '₹32,500', status: 'processing', date: '2024-01-16' },
    { id: 'ORD-1236', farmer: 'Organic Farms', buyer: 'Super Foods', amount: '₹67,800', status: 'shipped', date: '2024-01-16' },
    { id: 'ORD-1237', farmer: 'Happy Farms', buyer: 'Quick Mart', amount: '₹23,400', status: 'pending', date: '2024-01-17' },
  ];

  const handleVerifyUser = (userId) => {
    // Implement verification logic
    alert(`Verifying user ${userId}`);
  };

  const handleRejectUser = (userId) => {
    // Implement rejection logic
    alert(`Rejecting user ${userId}`);
  };

  const handleExportData = () => {
    // Implement export logic
    alert('Exporting data...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={handleExportData}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-green-600 text-sm mt-1">+12% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Listings</p>
              <p className="text-2xl font-bold">{stats.activeListings.toLocaleString()}</p>
              <p className="text-green-600 text-sm mt-1">+8% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-green-600 text-sm mt-1">+18% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Actions</p>
              <p className="text-2xl font-bold">{stats.pendingOrders + stats.disputeCount}</p>
              <p className="text-yellow-600 text-sm mt-1">Needs attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['overview', 'users', 'orders', 'crops', 'disputes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Revenue Trend</h3>
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => `₹${value/1000}k`} />
                        <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* User Growth Chart */}
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">User Growth</h3>
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="farmers" name="Farmers" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="buyers" name="Buyers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Distribution & Recent Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Crop Distribution */}
                <div className="bg-white p-4 rounded-lg border lg:col-span-1">
                  <h3 className="font-semibold mb-4">Crop Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cropDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {cropDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white p-4 rounded-lg border lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Recent Activities</h3>
                    <Activity className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                          activity.type === 'user' ? 'bg-blue-100' :
                          activity.type === 'order' ? 'bg-green-100' :
                          activity.type === 'crop' ? 'bg-yellow-100' :
                          activity.type === 'payment' ? 'bg-purple-100' : 'bg-red-100'
                        }`}>
                          {activity.type === 'user' && <Users className="h-4 w-4 text-blue-600" />}
                          {activity.type === 'order' && <Package className="h-4 w-4 text-green-600" />}
                          {activity.type === 'crop' && <Package className="h-4 w-4 text-yellow-600" />}
                          {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-purple-600" />}
                          {activity.type === 'issue' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.user}</div>
                          <div className="text-sm text-gray-600">{activity.action}</div>
                        </div>
                        <div className="text-sm text-gray-500">{activity.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* User Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                  <div className="text-blue-600 text-sm font-medium mb-1">Total Users</div>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <div className="text-green-600 text-sm">+124 this month</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                  <div className="text-green-600 text-sm font-medium mb-1">Farmers</div>
                  <div className="text-2xl font-bold">{stats.totalFarmers}</div>
                  <div className="text-green-600 text-sm">+42 this month</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
                  <div className="text-purple-600 text-sm font-medium mb-1">Buyers</div>
                  <div className="text-2xl font-bold">{stats.totalBuyers}</div>
                  <div className="text-green-600 text-sm">+82 this month</div>
                </div>
              </div>

              {/* Pending Verifications */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h3 className="font-semibold">Pending Verifications</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documents
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingVerifications.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">{user.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.type === 'Farmer' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {user.submitted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-gray-600">{user.docs} files</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleVerifyUser(user.id)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 inline mr-1" />
                                Verify
                              </button>
                              <button
                                onClick={() => handleRejectUser(user.id)}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                              >
                                <XCircle className="h-4 w-4 inline mr-1" />
                                Reject
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
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Order Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                  <div className="text-blue-600 text-sm font-medium mb-1">Total Orders</div>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <div className="text-green-600 text-sm">+18% from last month</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                  <div className="text-green-600 text-sm font-medium mb-1">Completed</div>
                  <div className="text-2xl font-bold">{stats.completedOrders}</div>
                  <div className="text-gray-600 text-sm">97% success rate</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg">
                  <div className="text-yellow-600 text-sm font-medium mb-1">Pending</div>
                  <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                  <div className="text-gray-600 text-sm">Needs attention</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
                  <div className="text-purple-600 text-sm font-medium mb-1">Avg. Order Value</div>
                  <div className="text-2xl font-bold">₹8,156</div>
                  <div className="text-green-600 text-sm">+5% from last month</div>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold">Recent Orders</h3>
                  <button className="text-primary-600 hover:text-primary-700 text-sm">
                    View All Orders
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Farmer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Buyer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">{order.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{order.farmer}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{order.buyer}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold">{order.amount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {order.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crops' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                  <div className="text-green-600 text-sm font-medium mb-1">Total Crops Listed</div>
                  <div className="text-2xl font-bold">{stats.totalCrops.toLocaleString()}</div>
                  <div className="text-green-600 text-sm">+256 this month</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg">
                  <div className="text-yellow-600 text-sm font-medium mb-1">Active Listings</div>
                  <div className="text-2xl font-bold">{stats.activeListings.toLocaleString()}</div>
                  <div className="text-green-600 text-sm">36% of total</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                  <div className="text-blue-600 text-sm font-medium mb-1">Avg. Price/Kg</div>
                  <div className="text-2xl font-bold">₹42.50</div>
                  <div className="text-green-600 text-sm">+3.2% from last month</div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Top Categories</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Vegetables', count: 860, percent: 35 },
                    { name: 'Grains', count: 614, percent: 25 },
                    { name: 'Fruits', count: 491, percent: 20 },
                    { name: 'Spices', count: 368, percent: 15 },
                    { name: 'Others', count: 123, percent: 5 },
                  ].map((category) => (
                    <div key={category.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{category.name}</span>
                        <span>{category.count} crops ({category.percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${category.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'disputes' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-red-600 text-sm font-medium mb-1">Active Disputes</div>
                    <div className="text-2xl font-bold">{stats.disputeCount}</div>
                    <div className="text-gray-600 text-sm">Requires immediate attention</div>
                  </div>
                  <Shield className="h-12 w-12 text-red-400" />
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Dispute Resolution</h3>
                <div className="space-y-4">
                  {[
                    { id: 1, title: 'Late Delivery Complaint', parties: 'Farmer vs Fresh Mart', status: 'pending', days: 2 },
                    { id: 2, title: 'Quality Issue', parties: 'Organic Farms vs Restaurant', status: 'in_progress', days: 5 },
                    { id: 3, title: 'Payment Dispute', parties: 'Green Valley vs Supermarket', status: 'resolved', days: 0 },
                  ].map((dispute) => (
                    <div key={dispute.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="font-medium">{dispute.title}</div>
                        <div className="text-sm text-gray-600">{dispute.parties}</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          dispute.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          dispute.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {dispute.status.replace('_', ' ')}
                        </span>
                        {dispute.days > 0 ? (
                          <span className="text-red-600 text-sm">
                            {dispute.days} day{dispute.days > 1 ? 's' : ''} pending
                          </span>
                        ) : (
                          <span className="text-green-600 text-sm">Resolved</span>
                        )}
                        <button className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;