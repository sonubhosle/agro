import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Globe,
  Shield,
  Moon,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Save,
  CheckCircle,
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      language: 'en',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      theme: 'light',
    },
    notifications: {
      email: {
        priceAlerts: true,
        orderUpdates: true,
        messages: false,
        promotions: true,
      },
      push: {
        priceAlerts: true,
        orderUpdates: true,
        messages: true,
        promotions: false,
      },
      sms: {
        orderUpdates: false,
        paymentConfirmations: true,
      },
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30,
      passwordChangedAt: '2024-01-01',
    },
    payment: {
      defaultMethod: 'upi',
      autoWithdrawal: true,
      withdrawalThreshold: 10000,
      taxInvoices: true,
    },
  });

  const handleSettingChange = (category, subcategory, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: {
          ...prev[category][subcategory],
          [key]: value,
        },
      },
    }));
  };

  const handleSaveSettings = () => {
    // Save settings logic
    console.log('Saving settings:', settings);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <SettingsIcon className="h-5 w-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'security', label: 'Security', icon: <Lock className="h-5 w-5" /> },
    { id: 'payment', label: 'Payment', icon: <Globe className="h-5 w-5" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="h-5 w-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Moon className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="md:w-64 border-b md:border-b-0 md:border-r border-gray-200">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">General Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, language: e.target.value }
                      }))}
                      className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी</option>
                      <option value="mr">मराठी</option>
                      <option value="ta">தமிழ்</option>
                      <option value="te">తెలుగు</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Zone
                    </label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, timezone: e.target.value }
                      }))}
                      className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Asia/Kolkata">India Standard Time (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="Europe/London">London</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={settings.general.currency}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, currency: e.target.value }
                      }))}
                      className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
                
                <div className="space-y-8">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-gray-600" />
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(settings.notifications.email).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{key.split(/(?=[A-Z])/).join(' ')}</div>
                            <div className="text-sm text-gray-600">Receive email notifications for {key}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleSettingChange('notifications', 'email', key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <Smartphone className="h-5 w-5 mr-2 text-gray-600" />
                      Push Notifications
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(settings.notifications.push).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{key.split(/(?=[A-Z])/).join(' ')}</div>
                            <div className="text-sm text-gray-600">Receive push notifications for {key}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleSettingChange('notifications', 'push', key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-gray-600" />
                      SMS Notifications
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(settings.notifications.sms).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{key.split(/(?=[A-Z])/).join(' ')}</div>
                            <div className="text-sm text-gray-600">Receive SMS for {key}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleSettingChange('notifications', 'sms', key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Security Settings</h2>
                
                <div className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium">Two-Factor Authentication</div>
                        <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.twoFactorAuth}
                          onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    {settings.security.twoFactorAuth && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="text-blue-800 text-sm">
                          Two-factor authentication is enabled. You'll need to enter a code from your authenticator app when signing in.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Login Alerts */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium">Login Alerts</div>
                        <div className="text-sm text-gray-600">Get notified when someone logs into your account</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.loginAlerts}
                          onChange={(e) => handleSettingChange('security', 'loginAlerts', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Session Timeout */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="mb-4">
                      <div className="font-medium">Session Timeout</div>
                      <div className="text-sm text-gray-600">Automatically log out after inactivity</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={0}>Never</option>
                      </select>
                      <div className="text-sm text-gray-600">
                        Current: {settings.security.sessionTimeout === 0 ? 'Never' : `${settings.security.sessionTimeout} minutes`}
                      </div>
                    </div>
                  </div>

                  {/* Password History */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium">Password Information</div>
                      <div className="text-sm text-gray-600">Last changed: {settings.security.passwordChangedAt}</div>
                    </div>
                    <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Payment Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Payment Method
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {['upi', 'card', 'netbanking', 'wallet', 'cod'].map((method) => (
                        <label
                          key={method}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            settings.payment.defaultMethod === method
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method}
                            checked={settings.payment.defaultMethod === method}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              payment: { ...prev.payment, defaultMethod: e.target.value }
                            }))}
                            className="sr-only"
                          />
                          <div className="font-medium capitalize">{method}</div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium">Auto Withdrawal</div>
                        <div className="text-sm text-gray-600">Automatically transfer earnings to your bank account</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.payment.autoWithdrawal}
                          onChange={(e) => handleSettingChange('payment', 'autoWithdrawal', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    {settings.payment.autoWithdrawal && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Withdrawal Threshold
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">₹</span>
                          <input
                            type="number"
                            value={settings.payment.withdrawalThreshold}
                            onChange={(e) => handleSettingChange('payment', 'withdrawalThreshold', parseInt(e.target.value))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          Funds will be transferred automatically when balance reaches this amount
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Tax Invoices</div>
                        <div className="text-sm text-gray-600">Automatically generate GST invoices for all transactions</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.payment.taxInvoices}
                          onChange={(e) => handleSettingChange('payment', 'taxInvoices', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Appearance</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Theme
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'light', label: 'Light', description: 'Default light theme' },
                        { id: 'dark', label: 'Dark', description: 'Dark mode for low light' },
                        { id: 'auto', label: 'Auto', description: 'Follow system preference' },
                      ].map((theme) => (
                        <label
                          key={theme.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            settings.general.theme === theme.id
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="theme"
                            value={theme.id}
                            checked={settings.general.theme === theme.id}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              general: { ...prev.general, theme: e.target.value }
                            }))}
                            className="sr-only"
                          />
                          <div className="font-medium">{theme.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{theme.description}</div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="font-medium mb-2">Font Size</div>
                    <div className="flex items-center space-x-4">
                      <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                        Smaller
                      </button>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="12"
                          max="20"
                          defaultValue="16"
                          className="w-full"
                        />
                      </div>
                      <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                        Larger
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveSettings}
                className="flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;