const express = require('express');
const router = express.Router();
const Experience = require('../models/Experience');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const recommendationEngine = require('../utils/recommendationEngine');

// Get personalized recommendations for a user
router.get('/personalized/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    // Get user's interaction data
    const user = await User.findById(userId).populate('favorites');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's bookings and reviews to exclude already interacted experiences
    const bookings = await Booking.find({ user: userId });
    const reviews = await Review.find({ user: userId });
    const interactedExperienceIds = [
      ...bookings.map(b => b.experience.toString()),
      ...reviews.map(r => r.experience.toString()),
      ...user.favorites.map(f => f._id.toString())
    ];

    // Get all available experiences excluding interacted ones
    const availableExperiences = await Experience.find({
      isActive: true,
      _id: { $nin: interactedExperienceIds }
    });

    // Train models if not trained
    if (!recommendationEngine.isTrained) {
      await recommendationEngine.trainAllModels();
    }

    // Get hybrid recommendations
    const hybridRecommendations = recommendationEngine.getHybridRecommendations(
      userId,
      user,
      availableExperiences,
      limit
    );

    // Convert to full experience objects
    const recommendedExperiences = await Promise.all(
      hybridRecommendations.map(async (rec) => {
        const experience = await Experience.findById(rec.id);
        return {
          ...experience.toObject(),
          recommendationScore: rec.score,
          recommendationType: rec.type
        };
      })
    );

    res.json({
      success: true,
      recommendations: recommendedExperiences
    });

  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to find similar users
async function findSimilarUsers(userId, userPreferences) {
  try {
    // Find users with similar favorites, bookings, or reviews
    const similarUsers = await User.find({
      _id: { $ne: userId },
      $or: [
        { favorites: { $in: userPreferences.categories } }, // This is not accurate, but simplified
        // In a real implementation, you'd compare preferences more accurately
      ]
    }).limit(10);

    return similarUsers;
  } catch (error) {
    console.error('Error finding similar users:', error);
    return [];
  }
}

// Get trending/popular experiences
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, timeframe = 'week' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get experiences with recent bookings and high ratings
    const trendingExperiences = await Experience.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'experience',
          as: 'recentBookings'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'experience',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          recentBookingCount: {
            $size: {
              $filter: {
                input: '$recentBookings',
                cond: { $gte: ['$$this.createdAt', startDate] }
              }
            }
          },
          averageRating: { $avg: '$reviews.rating' },
          reviewCount: { $size: '$reviews' }
        }
      },
      {
        $match: {
          isActive: true,
          recentBookingCount: { $gt: 0 }
        }
      },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ['$recentBookingCount', 10] },
              { $multiply: ['$averageRating', 5] },
              { $multiply: ['$reviewCount', 2] }
            ]
          }
        }
      },
      { $sort: { trendingScore: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          recentBookings: 0,
          reviews: 0
        }
      }
    ]);

    res.json({
      success: true,
      experiences: trendingExperiences
    });

  } catch (error) {
    console.error('Error getting trending experiences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get similar experiences to a given experience
router.get('/similar/:experienceId', async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { limit = 5 } = req.query;

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Find similar experiences based on category, tags, location, price range
    const similarExperiences = await Experience.find({
      _id: { $ne: experienceId },
      isActive: true,
      $or: [
        { category: experience.category },
        { tags: { $in: experience.tags } },
        { location: experience.location },
        {
          price: {
            $gte: experience.price * 0.8,
            $lte: experience.price * 1.2
          }
        }
      ]
    })
    .sort({ rating: -1, totalReviews: -1 })
    .limit(limit);

    // Calculate similarity scores
    const scoredExperiences = similarExperiences.map(exp => {
      let score = 0;
      if (exp.category === experience.category) score += 40;
      const tagMatches = exp.tags.filter(tag => experience.tags.includes(tag)).length;
      score += tagMatches * 15;
      if (exp.location === experience.location) score += 20;
      const priceDiff = Math.abs(exp.price - experience.price) / experience.price;
      score += Math.max(0, 20 - priceDiff * 100);
      score += exp.rating * 5;

      return { ...exp.toObject(), similarityScore: score };
    });

    scoredExperiences.sort((a, b) => b.similarityScore - a.similarityScore);

    res.json({
      success: true,
      similarExperiences: scoredExperiences
    });

  } catch (error) {
    console.error('Error getting similar experiences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Train recommendation models (admin endpoint)
router.post('/train', async (req, res) => {
  try {
    console.log('Starting model training...');
    await recommendationEngine.trainAllModels();
    res.json({
      success: true,
      message: 'Recommendation models trained successfully'
    });
  } catch (error) {
    console.error('Error training models:', error);
    res.status(500).json({ message: 'Error training models' });
  }
});

module.exports = router;