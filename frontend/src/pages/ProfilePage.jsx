import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Award,
  Star,
  Edit,
  Camera,
  Save,
  X,
  Package,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john@example.com',
    phone: user?.phone || '+91 9876543210',
    address: {
      street: '123 Farm Street',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
    },
    bio: user?.role === 'farmer' 
      ? 'Experienced farmer with 15+ years in organic farming. Specialized in tomatoes, potatoes, and seasonal vegetables.'
      : 'Business owner with 10+ years in fresh produce retail. Focused on quality and sustainable sourcing.',
    farmName: user?.farmName || 'Green Valley Farm',
    farmSize: user?.farmSize || '25',
    businessName: user?.businessName || 'Fresh Mart Enterprises',
    businessType: user?.businessType || 'retailer',
  });

  const stats = user?.role === 'farmer' 
    ? [
        { label: 'Total Crops Listed', value: '124', icon: <Package />, change: '+12%' },
        { label: 'Total Sales', value: '₹8,45,000', icon: <DollarSign />, change: '+18%' },
        { label: 'Success Rate', value: '98%', icon: <TrendingUp />, change: '+2%' },
        { label: 'Buyer Reviews', value: '4.8/5', icon: <Star />, change: '+0.2' },
      ]
    : [
        { label: 'Total Orders', value: '89', icon: <Package />, change: '+15%' },
        { label: 'Total Spend', value: '₹12,45,000', icon: <DollarSign />, change: '+22%' },
        { label: 'Farmers Connected', value: '24', icon: <Users />, change: '+8' },
        { label: 'Avg. Rating', value: '4.9/5', icon: <Star />, change: '+0.1' },
      ];

  const recentActivity = [
    { action: 'Updated crop listing', date: 'Today, 10:30 AM', type: 'update' },
    { action: 'Received payment for order #ORD-1234', date: 'Yesterday, 3:45 PM', type: 'payment' },
    { action: 'Added new crop photos', date: '2 days ago', type: 'upload' },
    { action: 'Verified KYC documents', date: '1 week ago', type: 'verification' },
  ];

  const handleSave = () => {
    // Save profile logic
    console.log('Saving profile:', profileData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal and account information</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <X className="h-4 w-4 inline mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Save className="h-4 w-4 inline mr-2" />
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Edit className="h-4 w-4 inline mr-2" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center mx-auto md:mx-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={profileData.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-primary-600" />
                  )}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 h-10 w-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700">
                    <Camera className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleChange}
                        className="text-2xl font-bold border-b border-gray-300 focus:outline-none focus:border-primary-600"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
                    )}
                    <div className="flex items-center mt-1">
                      <span className="capitalize px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                        {user?.role}
                      </span>
                      {user?.verified && (
                        <span className="ml-2 flex items-center text-green-600 text-sm">
                          <Shield className="h-4 w-4 mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="ml-1 font-bold">4.8</span>
                    <span className="text-gray-600 ml-1">(124 reviews)</span>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-6">
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="text-gray-600">{profileData.bio}</p>
                  )}
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleChange}
                        className="flex-1 px-3 py-1 border-b border-gray-300 focus:outline-none focus:border-primary-600"
                      />
                    ) : (
                      <span>{profileData.email}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleChange}
                        className="flex-1 px-3 py-1 border-b border-gray-300 focus:outline-none focus:border-primary-600"
                      />
                    ) : (
                      <span>{profileData.phone}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    {isEditing ? (
                      <input
                        type="text"
                        name="address.street"
                        value={profileData.address.street}
                        onChange={handleChange}
                        placeholder="Street"
                        className="flex-1 px-3 py-1 border-b border-gray-300 focus:outline-none focus:border-primary-600"
                      />
                    ) : (
                      <span>{profileData.address.street}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <span>Member since {new Date().getFullYear() - 2}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Specific Info */}
            {user?.role === 'farmer' && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4">Farm Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Farm Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="farmName"
                        value={profileData.farmName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <div className="font-medium">{profileData.farmName}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Farm Size (acres)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="farmSize"
                        value={profileData.farmSize}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <div className="font-medium">{profileData.farmSize} acres</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {user?.role === 'buyer' && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="businessName"
                        value={profileData.businessName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <div className="font-medium">{profileData.businessName}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Type
                    </label>
                    {isEditing ? (
                      <select
                        name="businessType"
                        value={profileData.businessType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="retailer">Retailer</option>
                        <option value="wholesaler">Wholesaler</option>
                        <option value="restaurant">Restaurant/Hotel</option>
                        <option value="processor">Processing Unit</option>
                        <option value="exporter">Exporter</option>
                        <option value="distributor">Distributor</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="font-medium capitalize">{profileData.businessType}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                    activity.type === 'payment' ? 'bg-green-100' :
                    activity.type === 'update' ? 'bg-blue-100' :
                    activity.type === 'upload' ? 'bg-yellow-100' :
                    'bg-purple-100'
                  }`}>
                    {activity.type === 'payment' && <DollarSign className="h-5 w-5 text-green-600" />}
                    {activity.type === 'update' && <Edit className="h-5 w-5 text-blue-600" />}
                    {activity.type === 'upload' && <Camera className="h-5 w-5 text-yellow-600" />}
                    {activity.type === 'verification' && <Shield className="h-5 w-5 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-gray-600">{activity.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Verification */}
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
            <div className="space-y-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-white rounded-lg mr-3">
                      <div className="text-primary-600">{stat.icon}</div>
                    </div>
                    <div>
                      <div className="font-medium">{stat.label}</div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </div>
                  </div>
                  <div className="text-green-600 font-medium">{stat.change}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
            <div className="space-y-4">
              {[
                { label: 'Email Verification', status: 'verified', icon: <Mail className="h-5 w-5" /> },
                { label: 'Phone Verification', status: 'verified', icon: <Phone className="h-5 w-5" /> },
                { label: 'KYC Documents', status: user?.verified ? 'verified' : 'pending', icon: <Shield className="h-5 w-5" /> },
                { label: 'Bank Account', status: 'verified', icon: <DollarSign className="h-5 w-5" /> },
                { label: 'GST Verification', status: user?.gstNumber ? 'verified' : 'not_required', icon: <Award className="h-5 w-5" /> },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      item.status === 'verified' ? 'bg-green-100' :
                      item.status === 'pending' ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      <div className={
                        item.status === 'verified' ? 'text-green-600' :
                        item.status === 'pending' ? 'text-yellow-600' :
                        'text-gray-600'
                      }>
                        {item.icon}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-sm ${
                        item.status === 'verified' ? 'text-green-600' :
                        item.status === 'pending' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  {item.status === 'pending' && (
                    <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">
                      Verify
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                Download Transaction History
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                View Tax Invoices
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                Update Payment Methods
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                Manage Notification Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;