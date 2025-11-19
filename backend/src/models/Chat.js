const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // 'user' or 'admin'
  senderId: { type: String, required: true }, // user ID or admin ID
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const ChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  messages: [MessageSchema],
  lastActivity: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
ChatSchema.index({ userId: 1, status: 1 });
ChatSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Chat', ChatSchema);