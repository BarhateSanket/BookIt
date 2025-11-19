const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const jwt = require('jsonwebtoken');

// Middleware to verify user token
const verifyUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key-here-change-in-production');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// GET /api/chat - Get user's chat
router.get('/', verifyUser, async (req, res) => {
  try {
    let chat = await Chat.findOne({
      userId: req.user.id,
      status: 'active'
    });

    if (!chat) {
      // Create new chat if none exists
      const user = JSON.parse(require('fs').readFileSync('./user_data.json', 'utf8')).find(u => u.id === req.user.id);
      chat = await Chat.create({
        userId: req.user.id,
        userName: user?.name || 'User',
        userEmail: user?.email || '',
        messages: [{
          sender: 'admin',
          senderId: 'system',
          message: 'Hello! How can I help you with your booking today?',
          timestamp: new Date()
        }]
      });
    }

    res.json({ success: true, chat });
  } catch (err) {
    console.error('Get chat error:', err);
    res.status(500).json({ success: false, message: 'Failed to get chat' });
  }
});

// POST /api/chat/message - Send message
router.post('/message', verifyUser, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    let chat = await Chat.findOne({
      userId: req.user.id,
      status: 'active'
    });

    if (!chat) {
      // Create new chat
      const user = JSON.parse(require('fs').readFileSync('./user_data.json', 'utf8')).find(u => u.id === req.user.id);
      chat = await Chat.create({
        userId: req.user.id,
        userName: user?.name || 'User',
        userEmail: user?.email || '',
        messages: []
      });
    }

    // Add user message
    chat.messages.push({
      sender: 'user',
      senderId: req.user.id,
      message: message.trim(),
      timestamp: new Date()
    });

    // Simple auto-response system
    const autoResponses = {
      'hello': 'Hi there! How can I assist you with your booking?',
      'help': 'I\'m here to help! What do you need assistance with?',
      'booking': 'I can help you with booking questions. What would you like to know?',
      'cancel': 'For cancellations, please go to your bookings page and click cancel on the booking you want to cancel.',
      'refund': 'Refunds are processed within 5-7 business days after cancellation.',
      'payment': 'We accept PayPal and credit card payments. All transactions are secure.',
      'default': 'Thanks for your message. An agent will respond shortly. For urgent matters, please call us at (555) 123-4567.'
    };

    let response = autoResponses.default;
    const lowerMessage = message.toLowerCase();

    for (const [key, value] of Object.entries(autoResponses)) {
      if (key !== 'default' && lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }

    // Add auto response
    chat.messages.push({
      sender: 'admin',
      senderId: 'auto',
      message: response,
      timestamp: new Date()
    });

    chat.lastActivity = new Date();
    await chat.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user.id}`).emit('chat-message', {
        chatId: chat._id,
        message: chat.messages[chat.messages.length - 1]
      });
    }

    res.json({ success: true, message: 'Message sent' });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// GET /api/chat/admin - Get all active chats (admin only)
router.get('/admin', async (req, res) => {
  try {
    // In a real app, you'd verify admin token here
    const chats = await Chat.find({ status: 'active' })
      .sort({ lastActivity: -1 })
      .limit(50);

    res.json({ success: true, chats });
  } catch (err) {
    console.error('Get admin chats error:', err);
    res.status(500).json({ success: false, message: 'Failed to get chats' });
  }
});

// POST /api/chat/admin/message - Admin send message
router.post('/admin/message', async (req, res) => {
  try {
    const { chatId, message } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    chat.messages.push({
      sender: 'admin',
      senderId: 'admin_user', // In real app, get from admin auth
      message: message.trim(),
      timestamp: new Date()
    });

    chat.lastActivity = new Date();
    await chat.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${chat.userId}`).emit('chat-message', {
        chatId: chat._id,
        message: chat.messages[chat.messages.length - 1]
      });
    }

    res.json({ success: true, message: 'Message sent' });
  } catch (err) {
    console.error('Admin send message error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

module.exports = router;