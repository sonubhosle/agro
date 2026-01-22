import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  MapPin,
  Calendar,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Download,
  MessageCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { fetchOrderById, updateOrderStatus } from '../../store/slices/orderSlice';

const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const [statusHistory, setStatusHistory] = useState([
    { status: 'pending', timestamp: '2024-01-15T10:30:00Z', description: 'Order placed' },
    { status: 'confirmed', timestamp: '2024-01-15T11:45:00Z', description: 'Farmer confirmed order' },
    { status: 'processing', timestamp: '2024-01-16T09:15:00Z', description: 'Crop being prepared' },
  ]);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));
    }
  }, [dispatch, id]);

  const handleStatusUpdate = (newStatus) => {
    if (currentOrder && window.confirm(`Are you sure you want to update status to ${newStatus}?`)) {
      dispatch(updateOrderStatus({ id: currentOrder._id, status: newStatus }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
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

  if (!currentOrder) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
        <p className="text-gray-600">The order you're looking for doesn't exist.</p>
        <Link
          to="/orders"
          className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const nextStatus = getNextStatus(currentOrder.status);
  const isFarmer = user?.role === 'farmer';
  const otherParty = isFarmer ? currentOrder.buyer : currentOrder.farmer;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Link
              to="/orders"
              className="text-primary-600 hover:text-primary-700"
            >
              ← Back to Orders
            </Link>
          </div>
          <div className="mt-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{currentOrder.orderId || currentOrder._id.slice(-8)}
            </h1>
            <div className="flex items-center mt-2 space-x-4">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                  currentOrder.status
                )}`}
              >
                {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
              </span>
              <span className="text-sm text-gray-600">
                Placed on {formatDate(currentOrder.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Invoice
          </button>
          <Link
            to={`/chat/${otherParty?._id}`}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message {isFarmer ? 'Buyer' : 'Farmer'}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <img
                  src={currentOrder.crop?.images?.[0] || '/placeholder-crop.jpg'}
                  alt={currentOrder.crop?.name}
                  className="h-20 w-20 rounded-lg object-cover mr-4"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-lg">{currentOrder.crop?.name}</h4>
                  <p className="text-gray-600">Variety: {currentOrder.crop?.variety}</p>
                  <p className="text-gray-600">Grade: {currentOrder.crop?.grade || 'A'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold">
                        {currentOrder.quantity} {currentOrder.crop?.unit || 'kg'}
                      </span>
                      <span className="text-gray-600 mx-2">×</span>
                      <span className="font-semibold">
                        {formatPrice(currentOrder.crop?.price || 0)}/{currentOrder.crop?.unit === 'ton' ? 'ton' : 'kg'}
                      </span>
                    </div>
                    <div className="text-lg font-bold">
                      {formatPrice(currentOrder.totalAmount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(currentOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Shipping</span>
                <span>{formatPrice(currentOrder.shippingCost || 0)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tax (GST)</span>
                <span>{formatPrice(currentOrder.taxAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(currentOrder.totalAmount + (currentOrder.shippingCost || 0) + (currentOrder.taxAmount || 0))}</span>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
            <div className="space-y-4">
              {statusHistory.map((step, index) => (
                <div key={index} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className={`w-3 h-3 rounded-full ${
                      step.status === 'delivered' ? 'bg-green-500' :
                      step.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                    }`}></div>
                    {index < statusHistory.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex justify-between">
                      <span className="font-medium capitalize">{step.status}</span>
                      <span className="text-sm text-gray-500">
                        {formatDate(step.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Order Actions */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Order Actions</h3>
            <div className="space-y-3">
              {currentOrder.status === 'pending' && isFarmer && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('confirmed')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Order
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </button>
                </>
              )}
              
              {currentOrder.status === 'confirmed' && isFarmer && (
                <button
                  onClick={() => handleStatusUpdate('processing')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Start Processing
                </button>
              )}
              
              {currentOrder.status === 'processing' && isFarmer && (
                <button
                  onClick={() => handleStatusUpdate('shipped')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Mark as Shipped
                </button>
              )}
              
              {currentOrder.status === 'shipped' && !isFarmer && (
                <button
                  onClick={() => handleStatusUpdate('delivered')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Delivery
                </button>
              )}

              {nextStatus && (
                <button
                  onClick={() => handleStatusUpdate(nextStatus)}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Update to {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                </button>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">
              {isFarmer ? 'Buyer Details' : 'Farmer Details'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                  <span className="font-semibold text-primary-600">
                    {otherParty?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium">{otherParty?.name || 'Unknown'}</h4>
                  <p className="text-sm text-gray-600">
                    {isFarmer ? 'Buyer' : 'Verified Farmer'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{otherParty?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{otherParty?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-start text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <span>
                    {currentOrder.deliveryAddress?.address || 'Address not provided'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Delivery Method</span>
                <span className="font-medium">Standard Shipping</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tracking Number</span>
                <span className="font-medium">TRK{currentOrder._id?.slice(-8)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Expected Delivery</span>
                <span className="font-medium">Jan 25, 2024</span>
              </div>
              <div className="flex items-start mt-4">
                <Truck className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentOrder.deliveryAddress?.address || 'No address provided'}
                    <br />
                    {currentOrder.deliveryAddress?.city && `${currentOrder.deliveryAddress.city}, `}
                    {currentOrder.deliveryAddress?.state}
                    {currentOrder.deliveryAddress?.pincode && ` - ${currentOrder.deliveryAddress.pincode}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">Online Payment</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className="font-medium text-green-600">Paid</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-medium text-sm">
                  TXN{currentOrder._id?.slice(-12)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Payment Date</span>
                <span className="font-medium">
                  {formatDate(currentOrder.paymentDate || currentOrder.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;