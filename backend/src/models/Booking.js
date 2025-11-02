const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  experience: { type: mongoose.Schema.Types.ObjectId, ref: 'Experience', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to authenticated user
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
