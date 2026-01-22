import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/slices/authSlice';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Building,
  UserCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const RegisterPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const defaultRole = queryParams.get('role') || 'buyer';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: defaultRole,
    address: {
      street: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
    },
    // Farmer specific
    farmName: '',
    farmSize: '',
    farmLocation: '',
    cropsSpecialization: [],
    // Buyer specific
    businessName: '',
    businessType: '',
    gstNumber: '',
    licenseNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedCrops, setSelectedCrops] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const cropsList = [
    'Tomato', 'Potato', 'Wheat', 'Rice', 'Onion', 'Maize',
    'Cotton', 'Sugarcane', 'Soybean', 'Groundnut', 'Pulses', 'Vegetables',
  ];

  const businessTypes = [
    'Retailer',
    'Wholesaler',
    'Restaurant/Hotel',
    'Processing Unit',
    'Exporter',
    'Distributor',
    'Other',
  ];

  const states = [
    'Maharashtra', 'Karnataka', 'Gujarat', 'Madhya Pradesh',
    'Uttar Pradesh', 'Rajasthan', 'Tamil Nadu', 'Andhra Pradesh',
    'Telangana', 'Kerala', 'Punjab', 'Haryana',
  ];

  const districts = [
    'Pune', 'Nashik', 'Nagpur', 'Kolhapur', 'Aurangabad',
    'Thane', 'Mumbai', 'Solapur', 'Amravati', 'Latur',
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else if (type === 'checkbox') {
      setSelectedCrops((prev) =>
        checked
          ? [...prev, value]
          : prev.filter((crop) => crop !== value)
      );
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid Indian phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required';
    }

    if (!formData.address.district.trim()) {
      newErrors['address.district'] = 'District is required';
    }

    if (!formData.address.state.trim()) {
      newErrors['address.state'] = 'State is required';
    }

    if (!formData.address.pincode) {
      newErrors['address.pincode'] = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.address.pincode)) {
      newErrors['address.pincode'] = 'Invalid pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (formData.role === 'farmer') {
      if (!formData.farmName.trim()) {
        newErrors.farmName = 'Farm name is required';
      }
      if (!formData.farmSize) {
        newErrors.farmSize = 'Farm size is required';
      }
    } else if (formData.role === 'buyer') {
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required';
      }
      if (!formData.businessType) {
        newErrors.businessType = 'Business type is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;

    try {
      const userData = {
        ...formData,
        cropsSpecialization: selectedCrops,
      };

      const result = await dispatch(register(userData)).unwrap();
      
      // Navigate based on user role
      if (result.user.role === 'farmer') {
        navigate('/dashboard/farmer');
      } else if (result.user.role === 'buyer') {
        navigate('/dashboard/buyer');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const stepTitles = [
    'Personal Information',
    'Location Details',
    formData.role === 'farmer' ? 'Farm Details' : 'Business Details',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join FarmConnect as a {formData.role === 'farmer' ? 'Farmer' : 'Buyer'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      stepNumber <= step
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNumber < step ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span className="mt-2 text-sm text-gray-600">
                    {stepTitles[stepNumber - 1]}
                  </span>
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      stepNumber < step ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Role Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Register as:
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, role: 'farmer' }));
                setStep(1);
              }}
              className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                formData.role === 'farmer'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <UserCircle className={`h-8 w-8 mb-2 ${
                formData.role === 'farmer' ? 'text-primary-600' : 'text-gray-400'
              }`} />
              <span className="font-medium">Farmer</span>
              <span className="text-sm text-gray-600 mt-1">Sell your crops</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, role: 'buyer' }));
                setStep(1);
              }}
              className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                formData.role === 'buyer'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Building className={`h-8 w-8 mb-2 ${
                formData.role === 'buyer' ? 'text-primary-600' : 'text-gray-400'
              }`} />
              <span className="font-medium">Buyer</span>
              <span className="text-sm text-gray-600 mt-1">Buy quality crops</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-2 border ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-2 border ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-2 border ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="9876543210"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-10 py-2 border ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-10 py-2 border ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location Details */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Location Details
              </h3>
              
              <div className="space-y-4">
                {/* Street Address */}
                <div>
                  <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="address.street"
                      name="address.street"
                      type="text"
                      value={formData.address.street}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-2 border ${
                        errors['address.street'] ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="123 Main Street"
                    />
                  </div>
                  {errors['address.street'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['address.street']}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      id="address.city"
                      name="address.city"
                      type="text"
                      value={formData.address.city}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors['address.city'] ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="City"
                    />
                    {errors['address.city'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['address.city']}</p>
                    )}
                  </div>

                  {/* District */}
                  <div>
                    <label htmlFor="address.district" className="block text-sm font-medium text-gray-700 mb-1">
                      District *
                    </label>
                    <select
                      id="address.district"
                      name="address.district"
                      value={formData.address.district}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors['address.district'] ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    >
                      <option value="">Select District</option>
                      {districts.map((district) => (
                        <option key={district} value={district.toLowerCase()}>
                          {district}
                        </option>
                      ))}
                    </select>
                    {errors['address.district'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['address.district']}</p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <select
                      id="address.state"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors['address.state'] ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state} value={state.toLowerCase()}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {errors['address.state'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['address.state']}</p>
                    )}
                  </div>

                  {/* Pincode */}
                  <div>
                    <label htmlFor="address.pincode" className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      id="address.pincode"
                      name="address.pincode"
                      type="text"
                      value={formData.address.pincode}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors['address.pincode'] ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="411001"
                    />
                    {errors['address.pincode'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['address.pincode']}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Role Specific Details */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {formData.role === 'farmer' ? 'Farm Details' : 'Business Details'}
              </h3>

              {formData.role === 'farmer' ? (
                <div className="space-y-6">
                  {/* Farm Name */}
                  <div>
                    <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-1">
                      Farm Name *
                    </label>
                    <input
                      id="farmName"
                      name="farmName"
                      type="text"
                      value={formData.farmName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors.farmName ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="Green Valley Farm"
                    />
                    {errors.farmName && (
                      <p className="mt-1 text-sm text-red-600">{errors.farmName}</p>
                    )}
                  </div>

                  {/* Farm Size */}
                  <div>
                    <label htmlFor="farmSize" className="block text-sm font-medium text-gray-700 mb-1">
                      Farm Size (acres) *
                    </label>
                    <input
                      id="farmSize"
                      name="farmSize"
                      type="number"
                      value={formData.farmSize}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors.farmSize ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="10"
                    />
                    {errors.farmSize && (
                      <p className="mt-1 text-sm text-red-600">{errors.farmSize}</p>
                    )}
                  </div>

                  {/* Farm Location */}
                  <div>
                    <label htmlFor="farmLocation" className="block text-sm font-medium text-gray-700 mb-1">
                      Farm Location
                    </label>
                    <input
                      id="farmLocation"
                      name="farmLocation"
                      type="text"
                      value={formData.farmLocation}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Village/Taluka"
                    />
                  </div>

                  {/* Crop Specialization */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Crop Specialization
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {cropsList.map((crop) => (
                        <label
                          key={crop}
                          className={`flex items-center p-2 border rounded-lg cursor-pointer transition-colors ${
                            selectedCrops.includes(crop)
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="crop"
                            value={crop}
                            checked={selectedCrops.includes(crop)}
                            onChange={handleChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm">{crop}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Business Name */}
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name *
                    </label>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      value={formData.businessName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors.businessName ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="Fresh Mart Enterprises"
                    />
                    {errors.businessName && (
                      <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
                    )}
                  </div>

                  {/* Business Type */}
                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
                      Business Type *
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors.businessType ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    >
                      <option value="">Select Business Type</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type.toLowerCase()}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.businessType && (
                      <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>
                    )}
                  </div>

                  {/* GST Number */}
                  <div>
                    <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      GST Number (Optional)
                    </label>
                    <input
                      id="gstNumber"
                      name="gstNumber"
                      type="text"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="27ABCDE1234F1Z5"
                    />
                  </div>

                  {/* License Number */}
                  <div>
                    <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Trade License Number (Optional)
                    </label>
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="TL20240012345"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 ${
                    loading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in here
            </Link>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;