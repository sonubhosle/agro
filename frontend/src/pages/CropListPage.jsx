import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Package,
  TrendingUp,
  Eye,
  ShoppingCart,
} from 'lucide-react';
import { fetchCrops, setFilters } from '../store/slices/cropSlice';

const CropListPage = () => {
  const dispatch = useDispatch();
  const { crops, loading, error, filters } = useSelector((state) => state.crops);
  const { user } = useSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const queryFilters = { ...filters };
    if (searchTerm) {
      queryFilters.search = searchTerm;
    }
    if (categoryFilter !== 'all') {
      queryFilters.category = categoryFilter;
    }
    queryFilters.minPrice = priceRange[0];
    queryFilters.maxPrice = priceRange[1];
    dispatch(fetchCrops(queryFilters));
  }, [dispatch, searchTerm, categoryFilter, priceRange]);

  const categories = [
    { value: 'all', label: 'All Crops' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'grains', label: 'Grains' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'spices', label: 'Spices' },
    { value: 'others', label: 'Others' },
  ];

  const districts = [
    'Pune', 'Nashik', 'Nagpur', 'Kolhapur', 'Aurangabad',
    'Thane', 'Mumbai', 'Solapur', 'Amravati', 'Latur'
  ];

  const handleAddToCart = (cropId) => {
    // Implement add to cart functionality
    alert(`Added crop ${cropId} to cart`);
  };

  const handleQuickBuy = (cropId) => {
    // Implement quick buy functionality
    alert(`Redirecting to buy crop ${cropId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Crops</h1>
          <p className="text-gray-600">
            Find fresh produce directly from farmers
          </p>
        </div>
        {user?.role === 'farmer' && (
          <Link
            to="/crops/add"
            className="mt-4 md:mt-0 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            + Add New Crop
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search crops by name, variety, or farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <Filter className="h-5 w-5 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <div className="text-sm text-gray-600">
              {crops.length} crops found
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setCategoryFilter(category.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        categoryFilter === category.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}/kg
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹0</span>
                  <span>₹500</span>
                  <span>₹1000</span>
                </div>
              </div>

              {/* District Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onChange={(e) => dispatch(setFilters({ district: e.target.value }))}
                >
                  <option value="">All Districts</option>
                  {districts.map((district) => (
                    <option key={district} value={district.toLowerCase()}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {crops.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No crops found
            </h3>
            <p className="text-gray-600">Try adjusting your search filters</p>
          </div>
        ) : (
          crops.map((crop) => (
            <div
              key={crop._id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Crop Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={crop.images?.[0] || '/placeholder-crop.jpg'}
                  alt={crop.name}
                  className="w-full h-full object-cover"
                />
                {crop.premium && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Premium
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {crop.quantity} {crop.unit}
                </div>
              </div>

              {/* Crop Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{crop.name}</h3>
                    <p className="text-sm text-gray-600">{crop.variety}</p>
                  </div>
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1 text-sm">4.5</span>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  {crop.location?.district}, {crop.location?.state}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{crop.price}/{crop.unit === 'ton' ? 'ton' : 'kg'}
                    </div>
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +5% vs district avg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">By</div>
                    <div className="font-medium">{crop.farmer?.name}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/crops/${crop._id}`}
                    className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                  {user?.role === 'buyer' && (
                    <>
                      <button
                        onClick={() => handleAddToCart(crop._id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Cart
                      </button>
                      <button
                        onClick={() => handleQuickBuy(crop._id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Buy Now
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {crops.length > 0 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-2">
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              1
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default CropListPage;