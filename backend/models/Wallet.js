const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  // User Reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Balance Information
  availableBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  pendingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  reservedBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalCredited: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalDebited: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Wallet Limits
  dailyLimit: {
    type: Number,
    default: 50000 // ₹50,000
  },
  
  monthlyLimit: {
    type: Number,
    default: 500000 // ₹5,00,000
  },
  
  // Security
  isActive: {
    type: Boolean,
    default: true
  },
  
  pinHash: {
    type: String,
    select: false
  },
  
  // Transactions
  transactions: [{
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['credit', 'debit', 'transfer', 'refund', 'withdrawal', 'deposit'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      required: true
    },
    reference: {
      type: String,
      required: true
    },
    orderId: mongoose.Schema.Types.ObjectId,
    paymentId: mongoose.Schema.Types.ObjectId,
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Bank Account Information
  bankAccounts: [{
    accountNumber: {
      type: String,
      required: true
    },
    accountHolderName: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    },
    ifscCode: {
      type: String,
      required: true
    },
    branch: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // UPI Information
  upiIds: [{
    upiId: {
      type: String,
      required: true,
      lowercase: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Audit Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastTransactionAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
walletSchema.index({ user: 1 });
walletSchema.index({ 'transactions.transactionId': 1 });
walletSchema.index({ 'transactions.createdAt': -1 });
walletSchema.index({ lastTransactionAt: -1 });

// Virtual for total balance
walletSchema.virtual('totalBalance').get(function() {
  return this.availableBalance + this.pendingBalance;
});

// Pre-save middleware
walletSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update last transaction date if transactions were modified
  if (this.isModified('transactions') && this.transactions.length > 0) {
    const latestTransaction = this.transactions[this.transactions.length - 1];
    this.lastTransactionAt = latestTransaction.createdAt;
  }
  
  next();
});

// Method to add transaction
walletSchema.methods.addTransaction = async function(transactionData) {
  const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const transaction = {
    transactionId,
    ...transactionData,
    createdAt: new Date()
  };
  
  this.transactions.push(transaction);
  
  // Update balances based on transaction type
  if (transaction.type === 'credit' && transaction.status === 'completed') {
    this.availableBalance += transaction.amount;
    this.totalCredited += transaction.amount;
  } else if (transaction.type === 'debit' && transaction.status === 'completed') {
    this.availableBalance -= transaction.amount;
    this.totalDebited += transaction.amount;
  } else if (transaction.type === 'withdrawal' && transaction.status === 'pending') {
    this.reservedBalance += transaction.amount;
    this.availableBalance -= transaction.amount;
  }
  
  return this.save();
};

// Method to check daily limit
walletSchema.methods.checkDailyLimit = function(amount) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayDebits = this.transactions
    .filter(t => 
      t.type === 'debit' && 
      t.status === 'completed' && 
      t.createdAt >= today
    )
    .reduce((sum, t) => sum + t.amount, 0);
  
  return (todayDebits + amount) <= this.dailyLimit;
};

// Method to check monthly limit
walletSchema.methods.checkMonthlyLimit = function(amount) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyDebits = this.transactions
    .filter(t => 
      t.type === 'debit' && 
      t.status === 'completed' && 
      t.createdAt >= firstDayOfMonth
    )
    .reduce((sum, t) => sum + t.amount, 0);
  
  return (monthlyDebits + amount) <= this.monthlyLimit;
};

// Static method to get wallet statistics
walletSchema.statics.getWalletStatistics = async function(userId) {
  const wallet = await this.findOne({ user: userId });
  
  if (!wallet) {
    return null;
  }
  
  // Calculate monthly statistics
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyTransactions = wallet.transactions.filter(t => 
    t.createdAt >= firstDayOfMonth
  );
  
  const monthlyCredits = monthlyTransactions
    .filter(t => t.type === 'credit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyDebits = monthlyTransactions
    .filter(t => t.type === 'debit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return {
    availableBalance: wallet.availableBalance,
    pendingBalance: wallet.pendingBalance,
    totalBalance: wallet.availableBalance + wallet.pendingBalance,
    totalCredited: wallet.totalCredited,
    totalDebited: wallet.totalDebited,
    monthlyCredits,
    monthlyDebits,
    monthlyNet: monthlyCredits - monthlyDebits,
    transactionCount: wallet.transactions.length
  };
};

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;