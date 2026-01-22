import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiStar, FiMapPin, FiPackage } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const CropCard = ({ crop, onFavoriteToggle }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFavoriteToggle = async () => {
    try {
      setLoading(true);
      
      if (isFavorite) {
        await api.delete(`/crops/${crop._id}/favorite`);
        toast.success('Removed from favorites');
      } else {
        await api.post(`/crops/${crop._id}/favorite`);
        toast.success('Added to favorites');
      }
      
      setIsFavorite(!isFavorite);
      onFavoriteToggle?.(crop._id, !isFavorite);
    } catch (error) {
      toast.error('Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const calculateDiscount = () => {
    if (crop.basePrice && crop.finalPrice) {
      const discount = ((crop.basePrice - crop.finalPrice) / crop.basePrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const discount = calculateDiscount();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
    >
      {/* Crop Image */}
      <div className="relative h-48 overflow-hidden">
        {crop.images?.[0]?.url ? (
          <img
            src={crop.images[0].url}
            alt={crop.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <FiPackage className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {discount}% OFF
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteToggle}
          disabled={loading}
          className={`absolute top-3 right-3 p-2 rounded-full ${
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FiHeart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        
        {/* Quality Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`px-2 py-1 text-xs font-semibold rounded ${
            crop.qualityGrade === 'Premium' || crop.qualityGrade === 'Organic'
              ? 'bg-green-100 text-green-800'
              : crop.qualityGrade === 'A'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {crop.qualityGrade}
          </span>
        </div>
      </div>

      {/* Crop Info */}
      <div className="p-4">
        {/* Crop Name and Variety */}
        <div className="mb-2">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
            {crop.name.charAt(0).toUpperCase() + crop.name.slice(1)}
          </h3>
          <p className="text-sm text-gray-600">{crop.variety}</p>
        </div>

        {/* Farmer Info */}
        <div className="flex items-center mb-3">
          {crop.farmer?.profileImage ? (
            <img
              src={crop.farmer.profileImage}
              alt={crop.farmer.fullName}
              className="h-6 w-6 rounded-full mr-2"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center mr-2">
              <span className="text-xs font-medium text-primary-600">
                {crop.farmer?.fullName?.charAt(0)}
              </span>
            </div>
          )}
          <span className="text-sm text-gray-700">{crop.farmer?.fullName}</span>
          {crop.farmer?.rating && (
            <div className="ml-auto flex items-center">
              <FiStar className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium ml-1">
                {crop.farmer.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <FiMapPin className="h-4 w-4 mr-1" />
          <span className="line-clamp-1">
            {crop.location?.district}, {crop.location?.state}
          </span>
        </div>

        {/* Price Section */}
        <div className="mb-4">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(crop.finalPrice || crop.pricePerUnit)}
            </span>
            <span className="text-sm text-gray-500 ml-2">per {crop.unit}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-500 line-through mr-2">
                {formatPrice(crop.basePrice)}
              </span>
              <span className="text-sm font-medium text-red-600">
                Save {formatPrice(crop.basePrice - (crop.finalPrice || crop.pricePerUnit))}
              </span>
            </div>
          )}
          
          {/* Market Price Comparison */}
          {crop.marketPrice && (
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded ${
                crop.priceDifference > 0
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {crop.priceDifference > 0 ? 'Above' : 'Below'} market by{' '}
                {formatPrice(Math.abs(crop.priceDifference))}
              </span>
            </div>
          )}
        </div>

        {/* Quantity and Availability */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Available:</span>
            <span className="font-medium">
              {crop.availableQuantity} {crop.unit}
            </span>
          </div>
          
          {/* Stock Indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                crop.availableQuantity / crop.quantity > 0.5
                  ? 'bg-green-500'
                  : crop.availableQuantity / crop.quantity > 0.2
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{
                width: `${(crop.availableQuantity / crop.quantity) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link
            to={`/crops/${crop._id}`}
            className="flex-1 bg-primary-600 text-white text-center py-2 rounded-lg hover:bg-primary-700 font-medium"
          >
            View Details
          </Link>
          <button
            onClick={() => {
              // Add to cart functionality
              toast.success('Added to cart');
            }}
            className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Additional Info */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Harvested: {new Date(crop.harvestDate).toLocaleDateString()}</span>
          <span>{crop.views || 0} views</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CropCard;