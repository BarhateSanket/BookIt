const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  date: { type: String, required: true },    // "2025-11-01"
  time: { type: String, required: true },    // "17:00"
  capacity: { type: Number, required: true },
  bookedCount: { type: Number, default: 0 },
  // Dynamic pricing fields
  dynamicPrice: { type: Number }, // Calculated dynamic price
  pricingFactors: [{ // Factors that influenced the price
    factor: String, // 'demand', 'time', 'seasonal', etc.
    multiplier: Number
  }],
  lastPriceUpdate: { type: Date, default: Date.now }
});

const ExperienceSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    index: 'text' // Text index for search
  },
  description: {
    type: String,
    index: 'text' // Text index for search
  },
  price: {
    type: Number,
    required: true,
    index: true // Index for price-based queries and sorting
  },
  images: [String],
  location: {
    type: String,
    index: true // Index for location-based queries
  },
  category: {
    type: String,
    required: true,
    index: true // Index for category filtering
  },
  rating: { 
    type: Number, 
    min: 0, 
    max: 5, 
    default: 0,
    index: true // Index for rating-based queries and sorting
  },
  duration: String, // e.g., "2 hours", "Half day", "Full day"
  latitude: {
    type: Number,
    index: '2dsphere' // Geospatial index for location-based searches
  },
  longitude: {
    type: Number,
    index: '2dsphere' // Geospatial index for location-based searches
  },
  slots: [SlotSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true // Index for filtering active experiences
  },
  tags: [{
    type: String,
    index: true // Index for tag-based filtering
  }],
  // Computed fields for performance
  availableSlotsCount: {
    type: Number,
    default: 0,
    index: true // Index for filtering by availability
  },
  averageRating: {
    type: Number,
    default: 0,
    index: true // Index for rating-based sorting
  },
  totalReviews: {
    type: Number,
    default: 0,
    index: true // Index for popularity sorting
  }
}, {
  timestamps: true
});

// Compound indexes for common query patterns
ExperienceSchema.index({ category: 1, isActive: 1 }); // Category filtering
ExperienceSchema.index({ category: 1, price: 1 }); // Category + price filtering
ExperienceSchema.index({ rating: -1, isActive: 1 }); // Rating sorting
ExperienceSchema.index({ price: 1, isActive: 1 }); // Price sorting
ExperienceSchema.index({ location: 1, isActive: 1 }); // Location filtering

// Text search index
ExperienceSchema.index({
  title: 'text',
  description: 'text',
  location: 'text',
  category: 'text',
  tags: 'text'
});

// Geospatial index for location-based searches
ExperienceSchema.index({ 
  latitude: 1, 
  longitude: 1 
});

// TTL index for automatic cleanup of old data (if needed)
ExperienceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 * 10 }); // 10 years

// Pre-save middleware to update computed fields
ExperienceSchema.pre('save', function(next) {
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  // Calculate available slots count
  if (this.slots && Array.isArray(this.slots)) {
    this.availableSlotsCount = this.slots.reduce((count, slot) => {
      return count + Math.max(0, slot.capacity - (slot.bookedCount || 0));
    }, 0);
  }
  
  next();
});

// Static methods for optimized queries
ExperienceSchema.statics.getOptimizedExperiences = function(options = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    priceMin,
    priceMax,
    rating,
    location,
    search,
    sortBy = 'createdAt',
    sortOrder = -1 // -1 for desc, 1 for asc
  } = options;
  
  const query = { isActive: true };
  
  // Build query conditions
  if (category) query.category = category;
  if (priceMin !== undefined || priceMax !== undefined) {
    query.price = {};
    if (priceMin !== undefined) query.price.$gte = priceMin;
    if (priceMax !== undefined) query.price.$lte = priceMax;
  }
  if (rating) query.rating = { $gte: rating };
  if (location) query.location = new RegExp(location, 'i');
  
  // Text search
  if (search) {
    query.$text = { $search: search };
  }
  
  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder;
  
  // Execute optimized query
  return this.find(query)
    .select('-slots') // Exclude slots from main query for better performance
    .sort(sortObj)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean() // Return plain objects for better performance
    .exec();
};

// Geospatial query for location-based searches
ExperienceSchema.statics.findNearLocation = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    isActive: true,
    latitude: { $ne: null },
    longitude: { $ne: null }
  })
  .where('location').near({
    center: { type: 'Point', coordinates: [longitude, latitude] },
    maxDistance: maxDistance
  })
  .select('-slots')
  .lean()
  .exec();
};

// Aggregate method for statistics
ExperienceSchema.statics.getStatistics = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalExperiences: { $sum: 1 },
        averagePrice: { $avg: '$price' },
        averageRating: { $avg: '$rating' },
        categoriesCount: { $addToSet: '$category' }
      }
    },
    {
      $project: {
        _id: 0,
        totalExperiences: 1,
        averagePrice: { $round: ['$averagePrice', 2] },
        averageRating: { $round: ['$averageRating', 2] },
        categoriesCount: { $size: '$categoriesCount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Experience', ExperienceSchema);
