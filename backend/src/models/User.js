const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  // Profile fields
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  phone: { type: String, default: '' },
  dateOfBirth: { type: Date },
  location: { type: String, default: '' },
  preferences: {
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: true },
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' }
  },
  // Social features
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Experience' }],
  savedSearches: [{
    name: { type: String, required: true },
    filters: {
      search: String,
      category: String,
      priceMin: Number,
      priceMax: Number,
      rating: Number,
      duration: String,
      location: String,
      latitude: Number,
      longitude: Number,
      radius: Number // in km
    },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
