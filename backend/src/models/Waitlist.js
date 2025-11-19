const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
  experience: { type: mongoose.Schema.Types.ObjectId, ref: 'Experience', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  status: { type: String, enum: ['waiting', 'offered', 'booked', 'expired'], default: 'waiting' },
  priority: { type: Number, default: 0 }, // For priority ordering
  expiresAt: { type: Date }, // When the offer expires
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
WaitlistSchema.index({ experience: 1, slotDate: 1, slotTime: 1 });
WaitlistSchema.index({ user: 1 });
WaitlistSchema.index({ status: 1 });
WaitlistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for expired offers

module.exports = mongoose.model('Waitlist', WaitlistSchema);