const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  experience: { type: mongoose.Schema.Types.ObjectId, ref: 'Experience', required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
