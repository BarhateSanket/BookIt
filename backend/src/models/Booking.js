const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  isOrganizer: { type: Boolean, default: false }
});

const PaymentSplitSchema = new mongoose.Schema({
  participantEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentId: { type: String } // Reference to payment transaction
});

const BookingSchema = new mongoose.Schema({
  experience: { type: mongoose.Schema.Types.ObjectId, ref: 'Experience', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to authenticated user (organizer)
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  notes: { type: String, default: '' },

  // Group booking fields
  isGroupBooking: { type: Boolean, default: false },
  participants: [ParticipantSchema],
  groupDiscount: { type: Number, default: 0 }, // Percentage discount for groups
  paymentSplits: [PaymentSplitSchema],

  // Blockchain fields
  paymentMethod: { type: String, enum: ['paypal', 'crypto'], default: 'paypal' },
  blockchainTxHash: { type: String },
  nftTokenId: { type: String },
  userWalletAddress: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
