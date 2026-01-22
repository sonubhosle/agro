const Chat = require('../models/Chat');
const User = require('../models/User');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { catchAsync } = require('../middleware/error');

// @desc    Get user's chats
// @route   GET /api/chat
// @access  Private
exports.getChats = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const chats = await Chat.find({
    participants: req.user.id,
    isActive: true
  })
    .populate('participants', 'fullName profileImage role')
    .populate('lastMessage.sender', 'fullName profileImage')
    .populate('order', 'orderId cropName')
    .populate('crop', 'name variety images')
    .sort('-lastMessage.timestamp')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Chat.countDocuments({
    participants: req.user.id,
    isActive: true
  });

  res.status(200).json({
    success: true,
    count: chats.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: chats
  });
});

// @desc    Get or create chat with user
// @route   GET /api/chat/user/:userId
// @access  Private
exports.getOrCreateUserChat = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  // Check if user exists
  const otherUser = await User.findById(userId);
  if (!otherUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if chat already exists
  let chat = await Chat.findOne({
    participants: { $all: [req.user.id, userId] },
    isActive: true
  })
    .populate('participants', 'fullName profileImage role')
    .populate('lastMessage.sender', 'fullName profileImage');

  // If no chat exists, create one
  if (!chat) {
    chat = await Chat.create({
      participants: [req.user.id, userId],
      isActive: true
    });

    // Populate after creation
    chat = await Chat.findById(chat._id)
      .populate('participants', 'fullName profileImage role')
      .populate('lastMessage.sender', 'fullName profileImage');
  }

  res.status(200).json({
    success: true,
    data: chat
  });
});

// @desc    Get or create chat for order
// @route   GET /api/chat/order/:orderId
// @access  Private
exports.getOrCreateOrderChat = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;

  // Check if order exists and user is participant
  const order = await Order.findById(orderId)
    .populate('buyer', 'fullName profileImage')
    .populate('farmer', 'fullName profileImage');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user is buyer or farmer
  if (
    order.buyer._id.toString() !== req.user.id &&
    order.farmer._id.toString() !== req.user.id
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this chat'
    });
  }

  // Check if chat already exists
  let chat = await Chat.findOne({
    order: orderId,
    isActive: true
  })
    .populate('participants', 'fullName profileImage role')
    .populate('lastMessage.sender', 'fullName profileImage');

  // If no chat exists, create one
  if (!chat) {
    chat = await Chat.create({
      participants: [order.buyer._id, order.farmer._id],
      order: orderId,
      crop: order.crop,
      isActive: true
    });

    // Populate after creation
    chat = await Chat.findById(chat._id)
      .populate('participants', 'fullName profileImage role')
      .populate('lastMessage.sender', 'fullName profileImage')
      .populate('order', 'orderId cropName')
      .populate('crop', 'name variety images');
  }

  res.status(200).json({
    success: true,
    data: chat
  });
});

// @desc    Get chat messages
// @route   GET /api/chat/:chatId/messages
// @access  Private
exports.getChatMessages = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const chat = await Chat.findById(chatId);
  
  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  // Check if user is participant
  if (!chat.participants.includes(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this chat'
    });
  }

  // Get messages with pagination
  const messages = chat.messages
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(skip, skip + parseInt(limit));

  // Mark messages as read
  const unreadMessages = chat.messages.filter(
    msg => !msg.readBy.includes(req.user.id) && msg.sender.toString() !== req.user.id
  );

  if (unreadMessages.length > 0) {
    unreadMessages.forEach(msg => {
      if (!msg.readBy.includes(req.user.id)) {
        msg.readBy.push(req.user.id);
      }
    });
    await chat.save();
  }

  // Populate sender info for messages
  const populatedMessages = await Promise.all(
    messages.map(async (msg) => {
      const sender = await User.findById(msg.sender).select('fullName profileImage');
      return {
        ...msg.toObject(),
        sender
      };
    })
  );

  res.status(200).json({
    success: true,
    count: populatedMessages.length,
    total: chat.messages.length,
    totalPages: Math.ceil(chat.messages.length / limit),
    currentPage: parseInt(page),
    data: populatedMessages.reverse() // Return in chronological order
  });
});

// @desc    Send message
// @route   POST /api/chat/:chatId/messages
// @access  Private
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;
  const { text, attachments } = req.body;

  const chat = await Chat.findById(chatId);
  
  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  // Check if user is participant
  if (!chat.participants.includes(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to send messages in this chat'
    });
  }

  // Create message
  const message = {
    sender: req.user.id,
    text,
    attachments,
    readBy: [req.user.id],
    timestamp: new Date()
  };

  // Add message to chat
  chat.messages.push(message);
  
  // Update last message
  chat.lastMessage = {
    text: text.length > 100 ? text.substring(0, 100) + '...' : text,
    sender: req.user.id,
    timestamp: new Date(),
    readBy: [req.user.id]
  };

  await chat.save();

  // Get other participant
  const otherParticipantId = chat.participants.find(
    id => id.toString() !== req.user.id
  );

  // Create notification for other participant
  const sender = await User.findById(req.user.id).select('fullName');
  await Notification.create({
    user: otherParticipantId,
    title: 'New Message',
    message: `${sender.fullName}: ${text.substring(0, 50)}...`,
    type: 'message',
    data: {
      chatId: chat._id,
      senderId: req.user.id,
      senderName: sender.fullName,
      actionUrl: `/chat/${chat._id}`
    }
  });

  // Emit real-time message via Socket.io
  const io = require('../server').io;
  io.to(`chat-${chatId}`).emit('new-message', {
    chatId,
    message: {
      ...message,
      sender: {
        _id: req.user.id,
        fullName: sender.fullName
      }
    }
  });

  // Send push notification
  const NotificationService = require('../utils/notificationService');
  const otherUser = await User.findById(otherParticipantId);
  if (otherUser && otherUser.notificationPreferences.push.message) {
    const notification = new Notification({
      user: otherParticipantId,
      title: 'New Message',
      message: `${sender.fullName}: ${text.substring(0, 50)}...`,
      type: 'message'
    });
    await NotificationService.sendPush(notification, otherUser);
  }

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: { message }
  });
});

// @desc    Mark chat as read
// @route   PUT /api/chat/:chatId/read
// @access  Private
exports.markChatAsRead = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  
  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  // Check if user is participant
  if (!chat.participants.includes(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this chat'
    });
  }

  // Mark all messages as read by this user
  chat.messages.forEach(msg => {
    if (!msg.readBy.includes(req.user.id)) {
      msg.readBy.push(req.user.id);
    }
  });

  // Update last message read status
  if (chat.lastMessage && !chat.lastMessage.readBy.includes(req.user.id)) {
    chat.lastMessage.readBy.push(req.user.id);
  }

  await chat.save();

  res.status(200).json({
    success: true,
    message: 'Chat marked as read',
    data: { chat }
  });
});

// @desc    Delete chat
// @route   DELETE /api/chat/:chatId
// @access  Private
exports.deleteChat = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  
  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  // Check if user is participant
  if (!chat.participants.includes(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this chat'
    });
  }

  // Soft delete (set isActive to false)
  chat.isActive = false;
  await chat.save();

  res.status(200).json({
    success: true,
    message: 'Chat deleted successfully'
  });
});

// @desc    Get unread message count
// @route   GET /api/chat/unread/count
// @access  Private
exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const chats = await Chat.find({
    participants: req.user.id,
    isActive: true
  });

  let unreadCount = 0;
  
  chats.forEach(chat => {
    const unreadMessages = chat.messages.filter(
      msg => !msg.readBy.includes(req.user.id) && msg.sender.toString() !== req.user.id
    );
    unreadCount += unreadMessages.length;
  });

  res.status(200).json({
    success: true,
    data: { unreadCount }
  });
});

// @desc    Search chats and messages
// @route   GET /api/chat/search
// @access  Private
exports.searchChats = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  // Search in user's chats
  const chats = await Chat.find({
    participants: req.user.id,
    isActive: true
  })
    .populate('participants', 'fullName profileImage role')
    .populate('order', 'orderId cropName')
    .populate('crop', 'name variety');

  // Filter chats where messages contain the query
  const filteredChats = chats.filter(chat => {
    // Check in participant names
    const participantMatch = chat.participants.some(
      participant => 
        participant._id.toString() !== req.user.id &&
        participant.fullName.toLowerCase().includes(query.toLowerCase())
    );

    // Check in order info
    const orderMatch = chat.order && 
      (chat.order.orderId.toLowerCase().includes(query.toLowerCase()) ||
       chat.order.cropName.toLowerCase().includes(query.toLowerCase()));

    // Check in crop info
    const cropMatch = chat.crop &&
      (chat.crop.name.toLowerCase().includes(query.toLowerCase()) ||
       chat.crop.variety.toLowerCase().includes(query.toLowerCase()));

    // Check in messages
    const messageMatch = chat.messages.some(
      message => message.text.toLowerCase().includes(query.toLowerCase())
    );

    return participantMatch || orderMatch || cropMatch || messageMatch;
  });

  // For each chat, get matching messages
  const results = await Promise.all(
    filteredChats.map(async (chat) => {
      const matchingMessages = chat.messages
        .filter(msg => msg.text.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5) // Limit to 5 messages per chat
        .map(msg => ({
          text: msg.text,
          timestamp: msg.timestamp,
          sender: msg.sender
        }));

      // Populate sender info for messages
      const populatedMessages = await Promise.all(
        matchingMessages.map(async (msg) => {
          const sender = await User.findById(msg.sender).select('fullName profileImage');
          return {
            ...msg,
            sender
          };
        })
      );

      return {
        chat: {
          _id: chat._id,
          participants: chat.participants,
          order: chat.order,
          crop: chat.crop,
          lastMessage: chat.lastMessage
        },
        messages: populatedMessages
      };
    })
  );

  res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
});