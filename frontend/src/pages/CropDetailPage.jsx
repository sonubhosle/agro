import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  MapPin,
  Calendar,
  Star,
  Package,
  Truck,
  CheckCircle,
  Share2,
  Heart,
  MessageCircle,
  Phone,
  Users,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { fetchCropById } from '../store/slices/cropSlice';

const CropDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCrop, loading, error } = useSelector((state) => state.crops);
  const { user } = useSelector((state) => state.auth);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchCropById(id));
    }
  }, [dispatch, id]);

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Implement buy now logic
    alert(`Buying ${quantity} ${currentCrop.unit} of ${currentCrop.name}`);
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Implement add to cart logic
    alert(`Added ${quantity} ${currentCrop.unit} to cart`);
  };

  const handleContactFarmer = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Implement contact farmer logic
    navigate(`/chat/${currentCrop.farmer?._id}`);
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

  if (!currentCrop) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Crop Not Found</h3>
        <p className="text-gray-600">The crop you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/crops')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Browse Crops
        </button>
      </div>
    );
  }

  const priceHistory = [
    { date: '1 Jan', price: 42 },
    { date: '2 Jan', price: 43 },
    { date: '3 Jan', price: 44 },
    { date: '4 Jan', price: 43 },
    { date: '5 Jan', price: 45 },
    { date: '6 Jan', price: 46 },
    { date: 'Today', price: 47 },
  ];

  const farmerReviews = [
    { user: 'Fresh Mart', rating: 5, comment: 'Excellent quality produce', date: '2 days ago' },
    { user: 'City Supermarket', rating: 4, comment: 'Good quality, timely delivery', date: '1 week ago' },
    { user: 'Restaurant Chain', rating: 5, comment: 'Consistently fresh produce', date: '2 weeks ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-600">
        <button onClick={() => navigate('/crops')} className="hover:text-gray-900">
          Crops
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{currentCrop.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Image */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="h-96 rounded-lg overflow-hidden mb-4">
              <img
                src={currentCrop.images?.[selectedImage] || '/placeholder-crop.jpg'}
                alt={currentCrop.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail Images */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {currentCrop.images?.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${currentCrop.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Crop Details */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentCrop.name} - {currentCrop.variety}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Quantity Available</div>
                  <div className="font-medium">
                    {currentCrop.quantity} {currentCrop.unit}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Harvest Date</div>
                  <div className="font-medium">
                    {new Date(currentCrop.harvestDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Quality Grade</div>
                  <div className="font-medium">{currentCrop.grade || 'A'}</div>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm text-gray-600">Location</div>
                  <div className="font-medium">
                    {currentCrop.location?.district}, {currentCrop.location?.state}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600">
                {currentCrop.description || 'Fresh, high-quality produce directly from the farm.'}
              </p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Price History</h3>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Last 7 days</div>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+5.8% increase</span>
                </div>
              </div>
              <div className="flex items-end h-32 space-x-2">
                {priceHistory.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-primary-200 rounded-t"
                      style={{ height: `${(item.price / 50) * 100}%` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">{item.date}</div>
                    <div className="text-xs font-medium">₹{item.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Farmer Reviews */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Farmer Reviews</h3>
            <div className="space-y-4">
              {farmerReviews.map((review, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{review.user}</div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{review.date}</div>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Price & Actions */}
        <div className="space-y-6">
          {/* Price Card */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  ₹{currentCrop.price}/{currentCrop.unit === 'ton' ? 'ton' : 'kg'}
                </div>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+5% vs district average</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-2 rounded-lg ${
                    isFavorite
                      ? 'bg-red-50 text-red-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity ({currentCrop.unit})
              </label>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 border border-gray-300 rounded-l-lg hover:bg-gray-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={currentCrop.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="flex-1 px-3 py-1 border-t border-b border-gray-300 text-center"
                />
                <button
                  onClick={() => setQuantity(Math.min(currentCrop.quantity, quantity + 1))}
                  className="px-3 py-1 border border-gray-300 rounded-r-lg hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Available: {currentCrop.quantity} {currentCrop.unit}
              </div>
            </div>

            {/* Total Price */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Price</span>
                <span>₹{currentCrop.price * quantity}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Shipping</span>
                <span>₹{quantity * 50}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{currentCrop.price * quantity + quantity * 50}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleBuyNow}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Buy Now
              </button>
              {user?.role === 'buyer' && (
                <button
                  onClick={handleAddToCart}
                  className="w-full py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium"
                >
                  Add to Cart
                </button>
              )}
              <button
                onClick={handleContactFarmer}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Contact Farmer
              </button>
            </div>

            {/* Safety Tips */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Safety Tips</p>
                  <p className="text-yellow-700 mt-1">
                    • Verify farmer credentials before payment
                    <br />
                    • Use secure payment methods
                    <br />
                    • Meet in safe, public locations for pickup
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Farmer Info */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Farmer Details</h3>
            <div className="flex items-start mb-4">
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {currentCrop.farmer?.name || 'Unknown Farmer'}
                </div>
                <div className="text-sm text-gray-600">Verified Farmer</div>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="ml-1 text-sm">4.8 (124 reviews)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                <span>{currentCrop.farmer?.location || 'Location not specified'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                <span>{currentCrop.farmer?.phone || 'Phone not provided'}</span>
              </div>
              <div className="text-sm text-gray-600">
                Member since {new Date(currentCrop.farmer?.createdAt || Date.now()).getFullYear()}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">98%</div>
                  <div className="text-xs text-gray-600">Success Rate</div>
                </div>
                <div>
                  <div className="text-lg font-bold">2.4K</div>
                  <div className="text-xs text-gray-600">Crops Sold</div>
                </div>
                <div>
                  <div className="text-lg font-bold">24h</div>
                  <div className="text-xs text-gray-600">Avg Response</div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Shipping & Delivery</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <Truck className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Free Shipping</p>
                  <p className="text-sm text-gray-600">
                    For orders above ₹5000
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Quality Guarantee</p>
                  <p className="text-sm text-gray-600">
                    100% quality satisfaction or money back
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Estimated Delivery:</p>
                <p>Within 3-5 days after order confirmation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropDetailPage;