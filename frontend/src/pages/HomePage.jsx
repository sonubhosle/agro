import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, TrendingUp, Users, Truck, CreditCard } from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Real-Time Prices',
      description: 'Get live crop prices updated every minute from district and state levels',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Direct Connection',
      description: 'Connect directly with farmers without any middlemen or commission',
    },
    {
      icon: <Truck className="h-8 w-8" />,
      title: 'Easy Logistics',
      description: 'Arrange transportation and delivery with trusted partners',
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: 'Secure Payments',
      description: 'Safe and secure payment system with escrow protection',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Verified Farmers',
      description: 'All farmers are verified with KYC and quality certification',
    },
  ];

  const crops = [
    { name: 'Tomato', price: '₹45/kg', trend: 'up', change: '+5%' },
    { name: 'Potato', price: '₹25/kg', trend: 'down', change: '-2%' },
    { name: 'Wheat', price: '₹2,200/ton', trend: 'up', change: '+3%' },
    { name: 'Rice', price: '₹3,500/ton', trend: 'stable', change: '0%' },
    { name: 'Onion', price: '₹35/kg', trend: 'up', change: '+8%' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Connect Directly with Farmers
            <span className="block text-primary-600">No Middlemen, Better Prices</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Buy fresh crops directly from farmers at real-time market prices.
            Sell your produce to verified buyers with secure payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register?role=farmer"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-lg"
            >
              Sell as Farmer
            </Link>
            <Link
              to="/register?role=buyer"
              className="px-8 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 font-semibold text-lg"
            >
              Buy as Business
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose FarmConnect?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="text-primary-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Prices Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Live Crop Prices</h2>
            <Link
              to="/prices"
              className="flex items-center text-primary-600 hover:text-primary-700"
            >
              View All Prices <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crop
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      24h Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      District Avg
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State Avg
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {crops.map((crop, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                            <span className="font-semibold text-green-600">
                              {crop.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium">{crop.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold">{crop.price}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${
                            crop.trend === 'up'
                              ? 'text-green-600'
                              : crop.trend === 'down'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {crop.change}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">₹42/kg</td>
                      <td className="px-6 py-4 text-gray-600">₹48/kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Agriculture?
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
            Join thousands of farmers and buyers who are already benefiting from
            direct connections and fair prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-100 font-semibold text-lg"
            >
              Get Started Free
            </Link>
            <Link
              to="/crops"
              className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white/10 font-semibold text-lg"
            >
              Browse Crops
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;