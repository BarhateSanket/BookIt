// Reviews & Ratings System - Backend Models

const mongoose = require('mongoose');

// Review Schema
const reviewSchema = new mongoose.Schema({
  experience: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experience',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  pros: {
    type: [String],
    default: [],
    maxlength: 50
  },
  cons: {
    type: [String],
    default: [],
    maxlength: 50
  },
  images: [{
    url: String,
    caption: {
      type: String,
      maxlength: 200
    }
  }],
  helpfulness: {
    upvotes: {
      type: Number,
      default: 0,
      index: true
    },
    downvotes: {
      type: Number,
      default: 0
    },
    usersVoted: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      vote: {
        type: String,
        enum: ['up', 'down']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationType: {
      type: String,
      enum: ['booking', 'identity', 'manual'],
      default: 'booking'
    }
  },
  moderation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged', 'removed'],
      default: 'pending',
      index: true
    },
    flags: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: {
        type: String,
        enum: ['spam', 'inappropriate', 'fake', 'duplicate', 'other'],
        required: true
      },
      description: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date,
    moderationNotes: String,
    removalReason: String
  },
  responses: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    isHostResponse: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isModerated: {
      type: Boolean,
      default: false
    }
  }],
  analytics: {
    views: {
      type: Number,
      default: 0,
      index: true
    },
    engagement: {
      type: Number,
      default: 0
    },
    lastViewedAt: Date
  },
  language: {
    type: String,
    default: 'en',
    index: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true,
    index: true
  },
  publishedAt: Date,
  updatedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual properties
reviewSchema.virtual('overallRating').get(function() {
  return this.rating;
});

reviewSchema.virtual('helpfulnessScore').get(function() {
  const { upvotes, downvotes } = this.helpfulness;
  const total = upvotes + downvotes;
  if (total === 0) return 0;
  return ((upvotes / total) * 100).toFixed(1);
});

reviewSchema.virtual('daysSinceBooking').get(function() {
  if (!this.booking) return null;
  const bookingDate = new Date(this.booking.experienceDate);
  const now = new Date();
  const diffTime = Math.abs(now - bookingDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

reviewSchema.virtual('reviewAge').get(function() {
  const now = new Date();
  const reviewDate = new Date(this.createdAt);
  const diffTime = Math.abs(now - reviewDate);
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.ceil(days / 7)} weeks ago`;
  if (days < 365) return `${Math.ceil(days / 30)} months ago`;
  return `${Math.ceil(days / 365)} years ago`;
});

// Indexes for performance (using proper Mongoose syntax)
reviewSchema.index({ experience: 1, user: 1 }, { unique: true });
reviewSchema.index({ experience: 1, 'moderation.status': 1, createdAt: -1 });
reviewSchema.index({ 'moderation.status': 1, createdAt: -1 });
reviewSchema.index({ 'moderation.flags.createdAt': -1 });
reviewSchema.index({ 'verification.isVerified': 1, createdAt: -1 });

// Middleware
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-publish if auto-approval is enabled
  if (this.moderation.status === 'pending' && !this.isModified('moderation.status')) {
    // Simple auto-approval logic (can be enhanced)
    if (this.content.length > 50 && this.rating >= 1) {
      this.moderation.status = 'approved';
      this.publishedAt = new Date();
    }
  }
  
  next();
});

// Static methods
reviewSchema.statics.getRatingSummary = async function(experienceId) {
  const pipeline = [
    { $match: { 
      experience: mongoose.Types.ObjectId(experienceId),
      'moderation.status': 'approved'
    }},
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: {
            rating: '$rating',
            count: 1
          }
        },
        verifiedCount: {
          $sum: { $cond: ['$verification.isVerified', 1, 0] }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({ rating, count: 0 })),
    verifiedCount: 0
  };
};

reviewSchema.statics.getTopReviews = async function(experienceId, limit = 5) {
  return this.find({
    experience: experienceId,
    'moderation.status': 'approved'
  })
  .sort({ 
    'helpfulness.upvotes': -1, 
    createdAt: -1 
  })
  .limit(limit)
  .populate('user', 'name avatar')
  .populate('responses.user', 'name avatar');
};

reviewSchema.statics.getRecentReviews = async function(experienceId, limit = 10) {
  return this.find({
    experience: experienceId,
    'moderation.status': 'approved'
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('user', 'name avatar');
};

reviewSchema.statics.getReviewsByRating = async function(experienceId, rating, limit = 10) {
  return this.find({
    experience: experienceId,
    rating: rating,
    'moderation.status': 'approved'
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('user', 'name avatar');
};

// Instance methods
reviewSchema.methods.voteHelpful = async function(userId) {
  const existingVote = this.helpfulness.usersVoted.find(
    vote => vote.user.toString() === userId.toString()
  );
  
  if (existingVote) {
    if (existingVote.vote === 'up') {
      // Remove existing upvote
      this.helpfulness.usersVoted = this.helpfulness.usersVoted.filter(
        vote => vote.user.toString() !== userId.toString()
      );
      this.helpfulness.upvotes = Math.max(0, this.helpfulness.upvotes - 1);
    } else {
      // Change downvote to upvote
      existingVote.vote = 'up';
      this.helpfulness.upvotes += 1;
      this.helpfulness.downvotes = Math.max(0, this.helpfulness.downvotes - 1);
    }
  } else {
    // Add new upvote
    this.helpfulness.usersVoted.push({
      user: userId,
      vote: 'up'
    });
    this.helpfulness.upvotes += 1;
  }
  
  await this.save();
};

reviewSchema.methods.voteNotHelpful = async function(userId) {
  const existingVote = this.helpfulness.usersVoted.find(
    vote => vote.user.toString() === userId.toString()
  );
  
  if (existingVote) {
    if (existingVote.vote === 'down') {
      // Remove existing downvote
      this.helpfulness.usersVoted = this.helpfulness.usersVoted.filter(
        vote => vote.user.toString() !== userId.toString()
      );
      this.helpfulness.downvotes = Math.max(0, this.helpfulness.downvotes - 1);
    } else {
      // Change upvote to downvote
      existingVote.vote = 'down';
      this.helpfulness.upvotes = Math.max(0, this.helpfulness.upvotes - 1);
      this.helpfulness.downvotes += 1;
    }
  } else {
    // Add new downvote
    this.helpfulness.usersVoted.push({
      user: userId,
      vote: 'down'
    });
    this.helpfulness.downvotes += 1;
  }
  
  await this.save();
};

reviewSchema.methods.flag = async function(userId, reason, description = '') {
  const existingFlag = this.moderation.flags.find(
    flag => flag.user.toString() === userId.toString()
  );
  
  if (existingFlag) {
    throw new Error('You have already flagged this review');
  }
  
  this.moderation.flags.push({
    user: userId,
    reason,
    description,
    createdAt: new Date()
  });
  
  // Auto-flag if too many flags
  if (this.moderation.flags.length >= 3) {
    this.moderation.status = 'flagged';
  }
  
  await this.save();
};

reviewSchema.methods.approve = async function(moderatorId, notes = '') {
  this.moderation.status = 'approved';
  this.moderation.moderatedBy = moderatorId;
  this.moderation.moderatedAt = new Date();
  this.moderation.moderationNotes = notes;
  this.publishedAt = new Date();
  
  // Auto-verify if from a completed booking
  if (this.verification.verificationType === 'booking') {
    this.verification.isVerified = true;
    this.verification.verifiedBy = moderatorId;
    this.verification.verifiedAt = new Date();
  }
  
  await this.save();
};

reviewSchema.methods.reject = async function(moderatorId, reason, notes = '') {
  this.moderation.status = 'rejected';
  this.moderation.moderatedBy = moderatorId;
  this.moderation.moderatedAt = new Date();
  this.moderation.moderationNotes = notes;
  this.moderation.removalReason = reason;
  this.isVisible = false;
  
  await this.save();
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;