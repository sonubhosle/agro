const crypto = require('crypto');
const logger = require('./logger');

class Helpers {
  // Generate random string
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate OTP
  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  // Generate unique ID
  static generateUniqueId(prefix = 'ID') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${random}`;
  }

  // Format currency
  static formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format date
  static formatDate(date, format = 'medium') {
    const dateObj = new Date(date);
    
    const options = {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      medium: {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      },
      long: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      },
      time: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      },
      datetime: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    };

    return dateObj.toLocaleDateString('en-IN', options[format] || options.medium);
  }

  // Calculate distance between coordinates (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static toRad(degrees) {
    return degrees * Math.PI / 180;
  }

  // Validate email
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Validate phone number (Indian)
  static validatePhone(phone) {
    const re = /^[6-9]\d{9}$/;
    return re.test(phone);
  }

  // Validate password strength
  static validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    };
  }

  // Sanitize input
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/[&<>"']/g, '') // Remove special characters
      .substring(0, 1000); // Limit length
  }

  // Truncate text
  static truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Create slug from text
  static createSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Parse query parameters
  static parseQueryParams(query) {
    const params = {};
    
    for (const [key, value] of Object.entries(query)) {
      if (value === 'true') params[key] = true;
      else if (value === 'false') params[key] = false;
      else if (!isNaN(value) && value !== '') params[key] = parseFloat(value);
      else if (value === 'null') params[key] = null;
      else if (value === 'undefined') params[key] = undefined;
      else params[key] = value;
    }
    
    return params;
  }

  // Calculate percentage change
  static calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  // Format file size
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Generate pagination metadata
  static generatePaginationMetadata(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      total,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    };
  }

  // Debounce function
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Merge objects deeply
  static deepMerge(target, source) {
    const output = Object.assign({}, target);
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  static isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // Generate CSV from array of objects
  static generateCSV(data, headers = null) {
    if (!data || data.length === 0) return '';
    
    const actualHeaders = headers || Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(actualHeaders.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = actualHeaders.map(header => {
        const value = row[header];
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  // Parse CSV to array of objects
  static parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      result.push(obj);
    }
    
    return result;
  }

  // Generate color from string (for avatars, etc.)
  static stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    
    return color;
  }

  // Get initials from name
  static getInitials(name) {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Calculate age from date
  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Generate time ago string
  static timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  }

  // Validate Indian vehicle number
  static validateVehicleNumber(vehicleNumber) {
    const re = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
    return re.test(vehicleNumber);
  }

  // Validate Indian Aadhar number
  static validateAadharNumber(aadhar) {
    const re = /^\d{12}$/;
    return re.test(aadhar);
  }

  // Validate Indian PAN number
  static validatePANNumber(pan) {
    const re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return re.test(pan);
  }

  // Validate Indian GST number
  static validateGSTNumber(gst) {
    const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return re.test(gst);
  }

  // Generate hash
  static generateHash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  // Compare hashes
  static compareHash(data, hash, algorithm = 'sha256') {
    return this.generateHash(data, algorithm) === hash;
  }

  // Encrypt data
  static encrypt(text, key = process.env.ENCRYPTION_KEY) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt data
  static decrypt(encryptedText, key = process.env.ENCRYPTION_KEY) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Generate JWT token (simplified)
  static generateJWT(payload, secret = process.env.JWT_SECRET, expiresIn = '7d') {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
    const encodedPayload = Buffer.from(JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    })).toString('base64');
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  // Parse JWT token (simplified)
  static parseJWT(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  }

  // Generate QR code data URL
  static generateQRCodeDataURL(text) {
    // In production, you would use a QR code library
    // This is a simplified version
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
    return qrCodeUrl;
  }

  // Validate URL
  static validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Extract domain from URL
  static extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return null;
    }
  }

  // Sleep/delay function
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry function with exponential backoff
  static async retry(fn, retries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      
      logger.warn(`Retrying... ${retries} attempts left`);
      await this.sleep(delay);
      
      return this.retry(fn, retries - 1, delay * 2);
    }
  }

  // Batch process array
  static async batchProcess(array, batchSize, processFn) {
    const results = [];
    
    for (let i = 0; i < array.length; i += batchSize) {
      const batch = array.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processFn));
      results.push(...batchResults);
      
      // Add small delay between batches
      if (i + batchSize < array.length) {
        await this.sleep(100);
      }
    }
    
    return results;
  }

  // Measure execution time
  static async measureExecutionTime(fn, label = 'Function') {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    
    logger.info(`${label} executed in ${end - start}ms`);
    return result;
  }

  // Create cache key
  static createCacheKey(...args) {
    return args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg);
      }
      return String(arg);
    }).join(':');
  }

  // Generate breadcrumbs
  static generateBreadcrumbs(path) {
    const parts = path.split('/').filter(part => part);
    const breadcrumbs = [{ name: 'Home', path: '/' }];
    
    let currentPath = '';
    for (const part of parts) {
      currentPath += `/${part}`;
      breadcrumbs.push({
        name: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
        path: currentPath
      });
    }
    
    return breadcrumbs;
  }

  // Format phone number with country code
  static formatPhoneWithCountryCode(phone, countryCode = '+91') {
    return `${countryCode} ${phone}`;
  }

  // Mask sensitive data
  static maskSensitiveData(data, visibleChars = 4) {
    if (!data) return '';
    
    const str = String(data);
    if (str.length <= visibleChars * 2) {
      return '*'.repeat(str.length);
    }
    
    const visibleStart = str.substring(0, visibleChars);
    const visibleEnd = str.substring(str.length - visibleChars);
    const maskedMiddle = '*'.repeat(str.length - (visibleChars * 2));
    
    return visibleStart + maskedMiddle + visibleEnd;
  }

  // Get file extension
  static getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  // Check if file is image
  static isImageFile(filename) {
    const ext = this.getFileExtension(filename);
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return imageExtensions.includes(ext);
  }

  // Check if file is document
  static isDocumentFile(filename) {
    const ext = this.getFileExtension(filename);
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
    return documentExtensions.includes(ext);
  }

  // Generate file icon based on extension
  static getFileIcon(filename) {
    const ext = this.getFileExtension(filename);
    
    const icons = {
      // Images
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
      'bmp': '🖼️', 'webp': '🖼️', 'svg': '🖼️',
      
      // Documents
      'pdf': '📄', 'doc': '📄', 'docx': '📄', 'txt': '📄',
      'rtf': '📄', 'odt': '📄',
      
      // Spreadsheets
      'xls': '📊', 'xlsx': '📊', 'csv': '📊', 'ods': '📊',
      
      // Presentations
      'ppt': '📽️', 'pptx': '📽️', 'odp': '📽️',
      
      // Archives
      'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',
      
      // Audio
      'mp3': '🎵', 'wav': '🎵', 'aac': '🎵', 'flac': '🎵',
      
      // Video
      'mp4': '🎬', 'avi': '🎬', 'mkv': '🎬', 'mov': '🎬',
      
      // Default
      'default': '📎'
    };
    
    return icons[ext] || icons.default;
  }

  // Calculate average
  static calculateAverage(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum / numbers.length;
  }

  // Calculate median
  static calculateMedian(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  }

  // Calculate standard deviation
  static calculateStandardDeviation(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    
    const avg = this.calculateAverage(numbers);
    const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
    const avgSquareDiff = this.calculateAverage(squareDiffs);
    
    return Math.sqrt(avgSquareDiff);
  }

  // Generate random number in range
  static randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Shuffle array
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Remove duplicates from array
  static removeDuplicates(array, key = null) {
    if (!key) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  // Group array by key
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const groupKey = item[key];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {});
  }

  // Sort array by key
  static sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Filter array by multiple conditions
  static filterByConditions(array, conditions) {
    return array.filter(item => {
      return Object.entries(conditions).every(([key, value]) => {
        if (typeof value === 'function') {
          return value(item[key]);
        }
        return item[key] === value;
      });
    });
  }

  // Map array with async function
  static async asyncMap(array, asyncFn) {
    const results = [];
    for (const item of array) {
      results.push(await asyncFn(item));
    }
    return results;
  }

  // Filter array with async function
  static async asyncFilter(array, asyncFn) {
    const results = [];
    for (const item of array) {
      if (await asyncFn(item)) {
        results.push(item);
      }
    }
    return results;
  }

  // Reduce array with async function
  static async asyncReduce(array, asyncFn, initialValue) {
    let accumulator = initialValue;
    for (const item of array) {
      accumulator = await asyncFn(accumulator, item);
    }
    return accumulator;
  }
}

module.exports = Helpers;