const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

class EmailService {
  constructor() {
    this.transporter = null;
    this.from = '"Farmer Marketplace" <noreply@farmermarketplace.com>';
    this.isRealEmail = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Check if we have email credentials
      const hasCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
      
      if (!hasCredentials) {
      
        this.setupMockTransporter();
        return;
      }

      // ALWAYS use REAL SMTP - no more Ethereal for development
      this.setupRealTransporter();
      
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.setupMockTransporter();
    }
  }

  setupRealTransporter() {
    try {
      
      // Remove spaces from password if any
      const password = process.env.EMAIL_PASSWORD.replace(/\s+/g, '');
      
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        requireTLS: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: password
        },
        tls: {
          rejectUnauthorized: false // For local development
        }
      });

      this.from = process.env.EMAIL_FROM || `"Farmer Marketplace" <${process.env.EMAIL_USER}>`;
      this.isRealEmail = true;

      
      // Test connection
      this.testConnection();
      
    } catch (error) {
      console.error('   ❌ Failed to create transporter:', error.message);
      this.setupMockTransporter();
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
     
    } catch (error) {
      console.error('   ❌ SMTP Connection failed:', error.message);
      if (error.code === 'EAUTH') {
        console.error('\n🔐 AUTHENTICATION ERROR:');
        console.error('   Wrong email or password');
        console.error('   Make sure:');
        console.error('   1. You\'re using App Password (16 chars, no spaces)');
        console.error('   2. Get App Password: https://myaccount.google.com/apppasswords');
        console.error('   3. Enable 2-Step Verification first');
      }
      this.setupMockTransporter();
    }
  }

  setupMockTransporter() {
  

    
    this.isRealEmail = false;
    this.from = '"Farmer Marketplace" <noreply@farmermarketplace.com>';
  }

  async sendEmail(to, subject, template, data) {
  console.log('SENDING EMAIL');
  
  try {
    const templateData = {
      ...data,           // Spread existing data
      subject: subject   // Add subject to the data object
    };
    
    // Get HTML content
    let html = this.getFallbackTemplate(template, templateData);
    
    // Try to load EJS template if exists
    const templatePath = path.join(__dirname, '../templates/email', `${template}.ejs`);
    if (fs.existsSync(templatePath)) {
      html = await ejs.renderFile(templatePath, templateData);
    } else {
      console.log('   ⚠ Using fallback HTML template');
    }

    const mailOptions = {
      from: this.from,
      to: to,
      subject: subject,
      html: html,
      text: this.generateTextVersion(template, templateData)
    };

    const startTime = Date.now();
    const info = await this.transporter.sendMail(mailOptions);
    const endTime = Date.now();
    
    return info;
    
  } catch (error) {
    console.error(`   ❌ Email failed:`, error.message);
    console.error(`   Error details:`, error.stack); // Add error stack for debugging
    

    
    return { 
      error: error.message, 
      failed: true,
      mock: true 
    };
  }
}

  // Generate text version for email clients
// Generate text version for email clients
generateTextVersion(template, data) {
  // ✅ FIX: Check if data has subject, otherwise use template name
  const subject = data.subject || template;
  
  switch (template) {
    case 'welcome':
      return `Welcome to Farmer Marketplace!\n\nHello ${data.name},\n\nWelcome! Your ${data.role} account has been created.\n\nEmail: ${data.email}\nRole: ${data.role}\n\nLogin: ${data.loginUrl}\n\nThank you for joining!`;
    
    case 'password-reset':
      return `Password Reset Request\n\nHello ${data.name},\n\nReset your password: ${data.resetUrl}\n\nExpires in ${data.expiryHours} hours.\n\nIf you didn't request this, ignore this email.`;
    
    case 'email-verification':
      return `Verify Your Email\n\nHello ${data.name},\n\nVerify your email: ${data.verificationUrl}\n\nExpires in ${data.expiryHours} hours.\n\nThank you!`;
    
    case 'order-confirmation':
      return `Order Confirmation\n\nHello ${data.buyerName},\n\nYour order #${data.orderId} has been confirmed!\n\nCrop: ${data.cropName}\nQuantity: ${data.quantity} ${data.unit}\nTotal Amount: ₹${data.totalAmount}\n\nOrder URL: ${data.orderUrl}\n\nThank you for your purchase!`;
    
    case 'new-order-notification':
      return `New Order Received\n\nHello ${data.farmerName},\n\nYou have received a new order #${data.orderId}!\n\nCrop: ${data.cropName}\nQuantity: ${data.quantity} ${data.unit}\nTotal Amount: ₹${data.totalAmount}\nBuyer: ${data.buyerName}\n\nOrder URL: ${data.orderUrl}\n\nPlease confirm this order.`;
    
    default:
      return `${subject}\n\n${JSON.stringify(data, null, 2)}`;
  }
}

  // Fallback HTML templates (if EJS files are missing)
  getFallbackTemplate(template, data) {
    const year = new Date().getFullYear();
    
    switch (template) {
      case 'welcome':
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Farmer Marketplace</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: #27ae60; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
              .button { display: inline-block; padding: 12px 24px; background: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌾 Welcome to Farmer Marketplace!</h1>
              </div>
              <p>Hello <strong>${data.name}</strong>,</p>
              <p>Welcome to Farmer Marketplace! Your ${data.role} account has been created successfully.</p>
              <p><strong>Account Details:</strong></p>
              <p>📧 Email: ${data.email}</p>
              <p>👤 Role: ${data.role}</p>
              <div style="text-align: center;">
                <a href="${data.loginUrl}" class="button">Get Started →</a>
              </div>
              <p>Need help? Contact our support team.</p>
              <div class="footer">
                <p>© ${year} Farmer Marketplace. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      
      case 'password-reset':
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: #e74c3c; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
              .button { display: inline-block; padding: 12px 24px; background: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }
              .warning { background: #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <p>Hello <strong>${data.name}</strong>,</p>
              <p>We received a request to reset your password.</p>
              <div class="warning">⚠️ This link expires in ${data.expiryHours} hour(s)</div>
              <div style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Reset Password →</a>
              </div>
              <p>Or copy this link:<br>
              <code style="background: #f8f9fa; padding: 10px; display: block; margin: 10px 0; border-radius: 5px; word-break: break-all;">
                ${data.resetUrl}
              </code></p>
              <p>If you didn't request this, please ignore this email.</p>
              <div class="footer">
                <p>© ${year} Farmer Marketplace. Security Team.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      
      case 'email-verification':
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: #3498db; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
              .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📧 Verify Your Email</h1>
              </div>
              <p>Hello <strong>${data.name}</strong>,</p>
              <p>Please verify your email address to complete your registration.</p>
              <div style="text-align: center;">
                <a href="${data.verificationUrl}" class="button">Verify Email →</a>
              </div>
              <p>Or copy this link:<br>
              <code style="background: #f8f9fa; padding: 10px; display: block; margin: 10px 0; border-radius: 5px; word-break: break-all;">
                ${data.verificationUrl}
              </code></p>
              <p>This link expires in ${data.expiryHours} hours.</p>
              <div class="footer">
                <p>© ${year} Farmer Marketplace</p>
              </div>
            </div>
          </body>
          </html>
        `;
      
      default:
        return `
          <!DOCTYPE html>
          <html>
          <body>
            <h2>${template}</h2>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </body>
          </html>
        `;
    }
  }

  async sendWelcomeEmail(user) {
    const data = {
      name: user.fullName,
      email: user.email,
      role: user.role,
      loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    };

    return await this.sendEmail(
      user.email,
      `Welcome to Farmer Marketplace, ${user.fullName}!`,
      'welcome',
      data
    );
  }

  async sendPasswordResetEmail(user, resetUrl) {
    const data = {
      name: user.fullName,
      resetUrl,
      expiryHours: 1
    };

    return await this.sendEmail(
      user.email,
      'Reset Your Password - Farmer Marketplace',
      'password-reset',
      data
    );
  }

  async sendVerificationEmail(user, verificationUrl) {
    const data = {
      name: user.fullName,
      verificationUrl,
      expiryHours: 24
    };

    return await this.sendEmail(
      user.email,
      'Verify Your Email - Farmer Marketplace',
      'email-verification',
      data
    );
  }

  // Test email sending
  async testEmailSending(testEmail = 'sbhosle1011@gmail.com') {
    console.log('\n' + '🧪'.repeat(30));
    console.log('EMAIL SENDING TEST');
    console.log('🧪'.repeat(30));
    
    const testUser = {
      fullName: 'Test User',
      email: testEmail,
      role: 'buyer'
    };
    
    try {
      console.log('\n1️⃣  Testing welcome email...');
      await this.sendWelcomeEmail(testUser);
      
      console.log('\n2️⃣  Testing password reset...');
      await this.sendPasswordResetEmail(
        testUser, 
        'http://localhost:3000/reset-password/test-token-123'
      );
      
      console.log('\n3️⃣  Testing verification email...');
      await this.sendVerificationEmail(
        testUser,
        'http://localhost:3000/verify-email/test-token-456'
      );
      
      console.log('\n' + '✅'.repeat(30));
      console.log('ALL TESTS COMPLETED');
      console.log('✅'.repeat(30));
      
      if (this.isRealEmail) {
        console.log('\n📱 Check your email:');
        console.log(`   ${testEmail}`);
        console.log('   (Also check spam folder)');
      } else {
        console.log('\n⚠️  Emails were NOT sent');
        console.log('   Configure .env with correct email credentials');
      }
      
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;