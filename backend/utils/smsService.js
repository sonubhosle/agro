const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendSMS(to, message) {
    try {
      const response = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${to}` // Assuming Indian numbers
      });
      
      console.log('SMS sent:', response.sid);
      return response;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async sendOTP(phone, otp) {
    const message = `Your Farmer Marketplace OTP is: ${otp}. Valid for 10 minutes.`;
    return this.sendSMS(phone, message);
  }

  async sendOrderUpdate(phone, orderId, status) {
    const message = `Order ${orderId} status updated to: ${status}. Check your dashboard for details.`;
    return this.sendSMS(phone, message);
  }

  async sendPriceAlert(phone, cropName, changeType, changePercentage) {
    const message = `Price ${changeType} alert: ${cropName} price changed by ${changePercentage}%. Check latest prices on Farmer Marketplace.`;
    return this.sendSMS(phone, message);
  }

  async sendPaymentConfirmation(phone, orderId, amount) {
    const message = `Payment of ₹${amount} for order ${orderId} confirmed. Thank you for your purchase!`;
    return this.sendSMS(phone, message);
  }
}

module.exports = new SMSService();