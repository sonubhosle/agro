const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Participants
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }],
  
  // Order reference (if chat is related to an order)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  
  // Crop reference (if chat is about a crop)
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    index: true
  },
  
  // Last message for quick access
  lastMessage: {
    text: {
      type: String,
      trim: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Messages
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'document', 'voice', 'video'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      name: String,
      size: Number,
      mimeType: String,
      thumbnail: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Chat settings
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    muteUntil: Date,
    archive: {
      type: Boolean,
      default: false
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Type of chat
  chatType: {
    type: String,
    enum: ['direct', 'order', 'group', 'support'],
    default: 'direct'
  },
  
  // Group chat specific fields
  groupInfo: {
    name: String,
    description: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    image: String
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Version for optimistic concurrency
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
chatSchema.index({ participants: 1, isActive: 1 });
chatSchema.index({ order: 1, isActive: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });
chatSchema.index({ createdAt: -1 });

// Virtual for unread message count per user
chatSchema.virtual('unreadCount').get(function() {
  return this.messages.filter(msg => 
    !msg.readBy.includes(this.participants[0]) && 
    msg.sender.toString() !== this.participants[0]
  ).length;
});

// Pre-save middleware
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.version += 1;
  
  // Ensure participants array has exactly 2 users for direct chats
  if (this.chatType === 'direct' && this.participants.length !== 2) {
    return next(new Error('Direct chats must have exactly 2 participants'));
  }
  
  // Ensure participants are unique
  const uniqueParticipants = [...new Set(this.participants.map(p => p.toString()))];
  if (uniqueParticipants.length !== this.participants.length) {
    return next(new Error('Chat participants must be unique'));
  }
  
  next();
});

// Method to add message
chatSchema.methods.addMessage = async function(messageData) {
  const message = {
    ...messageData,
    timestamp: new Date(),
    readBy: [messageData.sender]
  };
  
  this.messages.push(message);
  
  // Update last message
  this.lastMessage = {
    text: message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text,
    sender: message.sender,
    timestamp: message.timestamp,
    readBy: [message.sender]
  };
  
  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = async function(userId) {
  let updated = false;
  
  // Mark all messages as read by this user
  this.messages.forEach(msg => {
    if (!msg.readBy.includes(userId)) {
      msg.readBy.push(userId);
      updated = true;
    }
  });
  
  // Update last message read status
  if (this.lastMessage && !this.lastMessage.readBy.includes(userId)) {
    this.lastMessage.readBy.push(userId);
    updated = true;
  }
  
  if (updated) {
    await this.save();
  }
  
  return updated;
};

// Method to delete message
chatSchema.methods.deleteMessage = async function(messageId, userId) {
  const message = this.messages.id(messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }
  
  // Check permissions (sender or admin can delete)
  if (message.sender.toString() !== userId && !this.isAdmin(userId)) {
    throw new Error('Not authorized to delete this message');
  }
  
  // Soft delete
  message.deleted = true;
  message.deletedAt = new Date();
  message.deletedBy = userId;
  
  // If this was the last message, update lastMessage
  if (this.lastMessage && this.messages[this.messages.length - 1]._id.toString() === messageId) {
    const lastVisibleMessage = [...this.messages]
      .reverse()
      .find(msg => !msg.deleted);
    
    if (lastVisibleMessage) {
      this.lastMessage = {
        text: lastVisibleMessage.text.length > 100 ? 
          lastVisibleMessage.text.substring(0, 100) + '...' : 
          lastVisibleMessage.text,
        sender: lastVisibleMessage.sender,
        timestamp: lastVisibleMessage.timestamp,
        readBy: lastVisibleMessage.readBy
      };
    } else {
      this.lastMessage = null;
    }
  }
  
  return this.save();
};

// Method to check if user is admin (for group chats)
chatSchema.methods.isAdmin = function(userId) {
  if (this.chatType !== 'group') return false;
  return this.groupInfo.admins.some(admin => admin.toString() === userId);
};

// Static method to find or create direct chat
chatSchema.statics.findOrCreateDirectChat = async function(user1Id, user2Id) {
  // Check if chat already exists
  let chat = await this.findOne({
    participants: { $all: [user1Id, user2Id] },
    chatType: 'direct',
    isActive: true
  });
  
  if (!chat) {
    // Create new chat
    chat = new this({
      participants: [user1Id, user2Id],
      chatType: 'direct',
      isActive: true
    });
    
    await chat.save();
  }
  
  return chat;
};

// Static method to find or create order chat
chatSchema.statics.findOrCreateOrderChat = async function(orderId, buyerId, farmerId) {
  // Check if chat already exists
  let chat = await this.findOne({
    order: orderId,
    chatType: 'order',
    isActive: true
  });
  
  if (!chat) {
    // Create new chat
    chat = new this({
      participants: [buyerId, farmerId],
      order: orderId,
      chatType: 'order',
      isActive: true
    });
    
    await chat.save();
  }
  
  return chat;
};

// Static method to get chat statistics
chatSchema.statics.getChatStatistics = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        participants: userId,
        isActive: true
      }
    },
    {
      $facet: {
        totalChats: [{ $count: 'count' }],
        unreadChats: [
          {
            $match: {
              'lastMessage.readBy': { $ne: userId }
            }
          },
          { $count: 'count' }
        ],
        chatsByType: [
          {
            $group: {
              _id: '$chatType',
              count: { $sum: 1 }
            }
          }
        ],
        recentChats: [
          { $sort: { 'lastMessage.timestamp': -1 } },
          { $limit: 5 },
          {
            $project: {
              chatType: 1,
              'lastMessage.timestamp': 1,
              participants: 1,
              order: 1
            }
          }
        ]
      }
    }
  ]);
  
  return stats[0];
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;