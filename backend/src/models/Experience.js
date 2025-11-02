const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  date: { type: String, required: true },    // "2025-11-01"
  time: { type: String, required: true },    // "17:00"
  capacity: { type: Number, required: true },
  bookedCount: { type: Number, default: 0 }
});

const ExperienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  images: [String],
  location: String,
  category: String,
  rating: { type: Number, min: 0, max: 5, default: 0 },
  duration: String, // e.g., "2 hours", "Half day", "Full day"
  latitude: Number,
  longitude: Number,
  slots: [SlotSchema]
});

module.exports = mongoose.model('Experience', ExperienceSchema);
