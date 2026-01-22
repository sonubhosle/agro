const emailService = require('../../utils/emailService');


// ✅ Email 1: Order confirmation to BUYER
exports.sendBuyerConfirmationEmail = async function(order, buyer, farmer, crop) {
  try {
    // Format delivery address
    const deliveryAddr = order.deliveryAddress || {};
    const addressStr = [
      deliveryAddr.street,
      deliveryAddr.city,
      deliveryAddr.district,
      deliveryAddr.state,
      deliveryAddr.pincode
    ].filter(Boolean).join(', ') || 'Not specified';

    // Format pickup address
    const pickupAddr = order.pickupAddress || 'Not specified';

    const emailData = {
      subject: `🎉 Order Confirmed! #${order.orderId}`,
      buyerName: buyer.fullName,
      orderId: order.orderId,
      orderDate: order.createdAt.toLocaleDateString('en-IN'),
      orderTime: order.createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      
      // Order details
      cropName: crop.name,
      variety: crop.variety,
      quantity: order.quantity,
      unit: order.unit,
      pricePerUnit: order.pricePerUnit,
      
      // Farmer details
      farmerName: farmer.fullName,
      farmName: farmer.farmName || farmer.fullName + "'s Farm",
      farmerPhone: farmer.phone || 'Not provided',
      pickupAddress: pickupAddr,
      
      // Delivery details
      deliveryType: order.deliveryType,
      deliveryAddress: addressStr,
      specialInstructions: order.specialInstructions || 'None',
      
      // Price breakdown
      subtotal: order.subtotal.toFixed(2),
      discount: order.discount.toFixed(2),
      gstAmount: order.gstAmount.toFixed(2),
      gstPercentage: order.gstPercentage,
      shippingCost: order.shippingCost.toFixed(2),
      platformFee: order.platformFee.toFixed(2),
      totalAmount: order.totalAmount.toFixed(2),
      
      // Status
      status: order.status,
      
      // URLs
      orderUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}`,
      dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@agrotrade.com',
      
      // Year for footer
      year: new Date().getFullYear()
    };

    // Send email using EmailService
    const result = await emailService.sendEmail(
      buyer.email,
      emailData.subject,
      'order-confirmation',
      emailData
    );

    return result;
  } catch (error) {
    console.error('❌ Buyer email error:', error.message);
    throw error;
  }
}

// ✅ Email 2: New order notification to FARMER
exports.sendFarmerNotificationEmail = async function(order, buyer, farmer, crop) {
  try {
    const emailData = {
      subject: `🚜 New Order Received! #${order.orderId}`,
      farmerName: farmer.fullName,
      farmName: farmer.farmName || 'Your Farm',
      orderId: order.orderId,
      orderDate: order.createdAt.toLocaleDateString('en-IN'),
      orderTime: order.createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      
      // Order details
      cropName: crop.name,
      variety: crop.variety,
      quantity: order.quantity,
      unit: order.unit,
      pricePerUnit: order.pricePerUnit,
      totalAmount: order.totalAmount.toFixed(2),
      
      // Buyer details
      buyerName: buyer.fullName,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone || 'Not provided',
      
      // Delivery details
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryAddress ? 
        `${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''}` : 
        'Not specified',
      pickupAddress: order.pickupAddress,
      specialInstructions: order.specialInstructions || 'None',
      
      // Status
      status: order.status,
      
      // Action URLs
      orderUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/farmer/orders/${order._id}`,
      dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/farmer/dashboard`,
      manageOrdersUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/farmer/orders`,
      
      // Year for footer
      year: new Date().getFullYear()
    };

    // Send email using EmailService
    const result = await emailService.sendEmail(
      farmer.email,
      emailData.subject,
      'new-order-notification',
      emailData
    );

    return result;
  } catch (error) {
    console.error('❌ Farmer email error:', error.message);
    throw error;
  }
}
