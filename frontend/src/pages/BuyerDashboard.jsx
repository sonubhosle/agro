import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiShoppingCart,
  FiPackage,
  FiTrendingUp,
  FiMapPin,
  FiFilter,
  FiSearch,
} from 'react-icons/fi';
import CropCard from '../components/Buyer/CropCard';
import PriceChart from '../components/Charts/PriceChart';
import api from '../services/api';

const BuyerDashboard = () => {
  const [crops, setCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [priceData, setPriceData] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    savedAmount: 0,
    favoriteCrops: 0,
    activeSellers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cropName: '',
    district: '',
    minPrice: '',
    maxPrice: '',
    qualityGrade: '',
    sortBy: 'newest',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, crops, searchQuery]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch crops
      const cropsResponse = await api.get('/crops?limit=12');
      
      // Fetch buyer stats
      const ordersResponse = await api.get('/orders/buyer/statistics');
      
      // Mock price data
      const mockPriceData = {
        historicalData: [
          { date: '2024-01-01', price: 45.50, volume: 1000 },
          { date: '2024-01-02', price: 46.20, volume: 1200 },
          { date: '2024-01-03', price: 47.80, volume: 1100 },
          { date: '2024-01-04', price: 46.90, volume: 1300 },
          { date: '2024-01-05', price: 48.50, volume: 1400 },
          { date: '2024-01-06', price: 49.20, volume: 1500 },
          { date: '2024-01-07', price: 50.10, volume: 1600 },
        ],
      };

      setCrops(cropsResponse.data.data);
      setFilteredCrops(cropsResponse.data.data);
      setStats(ordersResponse.data);
      setPriceData(mockPriceData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...crops];

    // Apply search query
    if (searchQuery) {
      result = result.filter(crop =>
        crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crop.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crop.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.cropName) {
      result = result.filter(crop => crop.name === filters.cropName);
    }

    if (filters.district) {
      result = result.filter(crop => 
        crop.location?.district?.toLowerCase().includes(filters.district.toLowerCase())
      );
    }

    if (filters.minPrice) {
      result = result.filter(crop => crop.pricePerUnit >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      result = result.filter(crop => crop.pricePerUnit <= parseFloat(filters.maxPrice));
    }

    if (filters.qualityGrade) {
      result = result.filter(crop => crop.qualityGrade === filters.qualityGrade);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        break;
      case 'price-high':
        result.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'popular':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default:
        break;
    }

    setFilteredCrops(result);
  };

  const handleFavoriteToggle = (cropId, isFavorite) => {
    // Update local state if needed
    setCrops(crops.map(crop =>
      crop._id === cropId
        ? { ...crop, isFavorite: isFavorite }
        : crop
    ));
  };

  const cropOptions = [
    'wheat', 'rice', 'tomato', 'potato', 'onion',
    'cotton', 'sugarcane', 'maize', 'pulses',
    'vegetables', 'fruits'
  ];

  const qualityGrades = ['Premium', 'A', 'B', 'C', 'Organic'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.fullName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Find fresh produce directly from farmers at the best prices
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to="/orders"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-medium flex items-center"
          >
            <FiShoppingCart className="mr-2" />
            View Orders
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crops, varieties, or farmers..."
                className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Filter Button */}
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
            <FiFilter className="mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          <select
            value={filters.cropName}
            onChange={(e) => setFilters({ ...filters, cropName: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Crops</option>
            {cropOptions.map(crop => (
              <option key={crop} value={crop}>
                {crop.charAt(0).toUpperCase() + crop.slice(1)}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={filters.district}
            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
            placeholder="District"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            placeholder="Min Price"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            placeholder="Max Price"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

          <select
            value={filters.qualityGrade}
            onChange={(e) => setFilters({ ...filters, qualityGrade: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Grades</option>
            {qualityGrades.map(grade => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Price Trends */}
      {priceData && (
        <PriceChart data={priceData} cropName="Tomato" period="7d" />
      )}

      {/* Crops Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Fresh Crops Available
            <span className="text-sm text-gray-600 ml-2 font-normal">
              ({filteredCrops.length} items)
            </span>
          </h2>
          <Link
            to="/crops"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </Link>
        </div>

        {filteredCrops.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <FiPackage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No crops found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={() => {
                setFilters({
                  cropName: '',
                  district: '',
                  minPrice: '',
                  maxPrice: '',
                  qualityGrade: '',
                  sortBy: 'newest',
                });
                setSearchQuery('');
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCrops.map((crop) => (
              <CropCard
                key={crop._id}
                crop={crop}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Nearby Farms */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          <FiMapPin className="inline mr-2" />
          Farms Near You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                  <span className="text-lg font-bold text-primary-600">
                    {['R', 'S', 'K'][i - 1]}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium">{['Rajesh Farms', 'Sharma Agro', 'Kumar Farm'][i - 1]}</h3>
                  <p className="text-sm text-gray-600">
                    {['5 km away', '8 km away', '12 km away'][i - 1]}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <FiPackage className="h-4 w-4 mr-2" />
                <span>Specializes in: {['Tomatoes, Potatoes', 'Wheat, Rice', 'Vegetables'][i - 1]}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiTrendingUp className="h-4 w-4 mr-2" />
                <span>Rating: {['4.8', '4.5', '4.9'][i - 1]}/5</span>
              </div>
              <button className="w-full mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm">
                View Farm →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;