const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { queryValidation } = require('../middleware/validation');

// All chat routes require authentication
router.use(protect);

// Get user's chats
router.get('/', 
  validate(queryValidation.pagination), 
  chatController.getChats
);

// Get or create chat with user
router.get('/user/:userId', 
  chatController.getOrCreateUserChat
);

// Get or create chat for order
router.get('/order/:orderId', 
  chatController.getOrCreateOrderChat
);

// Get chat messages
router.get('/:chatId/messages', 
  validate(queryValidation.pagination), 
  chatController.getChatMessages
);

// Send message
router.post('/:chatId/messages', 
  chatController.sendMessage
);

// Mark chat as read
router.put('/:chatId/read', 
  chatController.markChatAsRead
);

// Delete chat
router.delete('/:chatId', 
  chatController.deleteChat
);

// Get unread message count
router.get('/unread/count', 
  chatController.getUnreadCount
);

// Search chats and messages
router.get('/search', 
  chatController.searchChats
);

module.exports = router;