const Experience = require('../models/Experience');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

class RecommendationEngine {
  constructor() {
    this.userItemMatrix = null;
    this.userIds = [];
    this.itemIds = [];
    this.isTrained = false;
  }

  // Initialize content-based preferences (rule-based instead of ML)
  async initializeContentBasedData() {
    try {
      console.log('Initializing content-based recommendation data...');

      // Get all experiences for content analysis
      this.allExperiences = await Experience.find({ isActive: true });

      console.log('Content-based data initialized successfully');
    } catch (error) {
      console.error('Error initializing content-based data:', error);
    }
  }

  // Train collaborative filtering model using matrix factorization approach
  async trainCollaborativeModel() {
    try {
      console.log('Training collaborative filtering model...');

      // Get user-item interaction matrix
      const users = await User.find({});
      const experiences = await Experience.find({ isActive: true });

      const userItemMatrix = {};

      // Initialize matrix
      users.forEach(user => {
        userItemMatrix[user._id.toString()] = {};
        experiences.forEach(exp => {
          userItemMatrix[user._id.toString()][exp._id.toString()] = 0;
        });
      });

      // Fill matrix with interactions
      // Favorites = 5, Bookings = 4, High reviews = rating value, Low reviews = rating/2
      for (const user of users) {
        // Favorites
        user.favorites.forEach(favId => {
          if (userItemMatrix[user._id.toString()][favId.toString()] !== undefined) {
            userItemMatrix[user._id.toString()][favId.toString()] = 5;
          }
        });

        // Bookings
        const userBookings = await Booking.find({ user: user._id });
        userBookings.forEach(booking => {
          if (userItemMatrix[user._id.toString()][booking.experience.toString()] !== undefined) {
            userItemMatrix[user._id.toString()][booking.experience.toString()] = Math.max(
              userItemMatrix[user._id.toString()][booking.experience.toString()],
              4
            );
          }
        });

        // Reviews
        const userReviews = await Review.find({ user: user._id });
        userReviews.forEach(review => {
          if (userItemMatrix[user._id.toString()][review.experience.toString()] !== undefined) {
            userItemMatrix[user._id.toString()][review.experience.toString()] = Math.max(
              userItemMatrix[user._id.toString()][review.experience.toString()],
              review.rating
            );
          }
        });
      }

      // Store the matrix for similarity calculations
      this.userItemMatrix = userItemMatrix;
      this.userIds = Object.keys(userItemMatrix);
      this.itemIds = experiences.map(e => e._id.toString());

      console.log('Collaborative filtering model trained successfully');

    } catch (error) {
      console.error('Error training collaborative model:', error);
    }
  }

  // Extract features from experience
  extractExperienceFeatures(experience) {
    const features = [];

    // Category encoding (one-hot style, simplified)
    const categories = ['adventure', 'food', 'art', 'sports', 'education', 'entertainment', 'other'];
    categories.forEach(cat => {
      features.push(experience.category.toLowerCase().includes(cat) ? 1 : 0);
    });

    // Price normalization (0-1 scale, assuming max price 1000)
    features.push(Math.min(experience.price / 1000, 1));

    // Rating normalization
    features.push(experience.rating / 5);

    // Location encoding (simplified - could use geohash)
    features.push(experience.latitude ? experience.latitude / 90 : 0);
    features.push(experience.longitude ? experience.longitude / 180 : 0);

    // Tags (simplified binary features for common tags)
    const commonTags = ['outdoor', 'indoor', 'group', 'solo', 'family', 'romantic', 'adventure', 'relaxing'];
    commonTags.forEach(tag => {
      features.push(experience.tags.some(t => t.toLowerCase().includes(tag)) ? 1 : 0);
    });

    return features;
  }

  // Extract features from user
  extractUserFeatures(user) {
    const features = [];

    // User preferences (if available)
    if (user.preferences) {
      features.push(user.preferences.notifications ? 1 : 0);
      features.push(user.preferences.newsletter ? 1 : 0);
      features.push(user.preferences.theme === 'dark' ? 1 : 0);
    } else {
      features.push(0, 0, 0);
    }

    // User activity level (based on favorites, bookings, reviews count)
    const activityScore = (user.favorites?.length || 0) + (user.savedSearches?.length || 0);
    features.push(Math.min(activityScore / 10, 1)); // Normalize

    // Age (if available)
    if (user.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear();
      features.push(Math.min(age / 100, 1)); // Normalize
    } else {
      features.push(0.3); // Default middle age
    }

    return features;
  }

  // Get collaborative recommendations for a user
  getCollaborativeRecommendations(userId, limit = 10) {
    if (!this.userItemMatrix || !this.userItemMatrix[userId]) {
      return [];
    }

    const userRatings = this.userItemMatrix[userId];
    const similarities = {};

    // Calculate similarity with all other users
    this.userIds.forEach(otherUserId => {
      if (otherUserId !== userId) {
        similarities[otherUserId] = this.cosineSimilarity(userRatings, this.userItemMatrix[otherUserId]);
      }
    });

    // Sort users by similarity
    const sortedUsers = Object.keys(similarities).sort((a, b) => similarities[b] - similarities[a]);

    // Get recommendations from top similar users
    const recommendations = {};
    const userInteractedItems = new Set(Object.keys(userRatings).filter(item => userRatings[item] > 0));

    sortedUsers.slice(0, 10).forEach(similarUserId => {
      const similarUserRatings = this.userItemMatrix[similarUserId];
      Object.keys(similarUserRatings).forEach(itemId => {
        if (!userInteractedItems.has(itemId) && similarUserRatings[itemId] >= 4) {
          if (!recommendations[itemId]) {
            recommendations[itemId] = 0;
          }
          recommendations[itemId] += similarities[similarUserId] * similarUserRatings[itemId];
        }
      });
    });

    // Sort recommendations by score
    const sortedRecommendations = Object.keys(recommendations)
      .sort((a, b) => recommendations[b] - recommendations[a])
      .slice(0, limit);

    return sortedRecommendations;
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vecA, vecB) {
    const items = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    items.forEach(item => {
      const a = vecA[item] || 0;
      const b = vecB[item] || 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    });

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Get content-based recommendations using rule-based scoring
  getContentBasedRecommendations(user, experiences, limit = 10) {
    if (!user) {
      return [];
    }

    // Get user's preferences from their interaction history
    const userPreferences = this.analyzeUserPreferences(user);

    const scoredExperiences = experiences.map(exp => {
      let score = 0;

      // Category preference
      if (userPreferences.categories.includes(exp.category)) {
        score += 30;
      }

      // Tag matches
      const tagMatches = exp.tags.filter(tag => userPreferences.tags.includes(tag)).length;
      score += tagMatches * 10;

      // Price similarity
      if (userPreferences.priceRange.min > 0 || userPreferences.priceRange.max < Infinity) {
        const avgUserPrice = (userPreferences.priceRange.min + userPreferences.priceRange.max) / 2;
        const priceDiff = Math.abs(exp.price - avgUserPrice);
        const maxDiff = Math.max(avgUserPrice * 0.5, 50); // Allow 50% variance or $50
        score += Math.max(0, 20 - (priceDiff / maxDiff) * 20);
      }

      // Rating preference
      const avgUserRating = userPreferences.ratings.reduce((a, b) => a + b, 0) / userPreferences.ratings.length || 0;
      if (avgUserRating > 0) {
        score += Math.max(0, 15 - Math.abs(exp.rating - avgUserRating) * 3);
      }

      // Location preference (if user has location history)
      if (userPreferences.locations.length > 0 && exp.location) {
        if (userPreferences.locations.includes(exp.location)) {
          score += 25;
        }
      }

      return { experience: exp, score };
    });

    return scoredExperiences
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Analyze user preferences from their data
  analyzeUserPreferences(user) {
    const preferences = {
      categories: [],
      tags: [],
      priceRange: { min: 0, max: Infinity },
      locations: [],
      ratings: []
    };

    // From favorites
    user.favorites.forEach(exp => {
      if (!preferences.categories.includes(exp.category)) {
        preferences.categories.push(exp.category);
      }
      exp.tags.forEach(tag => {
        if (!preferences.tags.includes(tag)) {
          preferences.tags.push(tag);
        }
      });
      preferences.priceRange.min = Math.min(preferences.priceRange.min, exp.price);
      preferences.priceRange.max = Math.max(preferences.priceRange.max, exp.price);
      if (!preferences.locations.includes(exp.location)) {
        preferences.locations.push(exp.location);
      }
      preferences.ratings.push(exp.rating);
    });

    return preferences;
  }

  // Train all models
  async trainAllModels() {
    await this.initializeContentBasedData();
    await this.trainCollaborativeModel();
    this.isTrained = true;
    console.log('All recommendation models trained');
  }

  // Get hybrid recommendations combining both approaches
  getHybridRecommendations(userId, user, experiences, limit = 10) {
    const collaborativeRecs = this.getCollaborativeRecommendations(userId, limit * 2);
    const contentBasedRecs = this.getContentBasedRecommendations(user, experiences, limit * 2);

    // Combine and deduplicate
    const combinedRecs = new Map();

    // Add collaborative recommendations
    collaborativeRecs.forEach((expId, index) => {
      combinedRecs.set(expId, {
        id: expId,
        score: (limit - index) / limit * 50, // Score based on rank
        type: 'collaborative'
      });
    });

    // Add content-based recommendations
    contentBasedRecs.forEach((rec, index) => {
      const expId = rec.experience._id.toString();
      const existing = combinedRecs.get(expId);
      if (existing) {
        existing.score += rec.score * 50; // Boost score if both recommend
        existing.type = 'hybrid';
      } else {
        combinedRecs.set(expId, {
          id: expId,
          score: rec.score * 50,
          type: 'content-based'
        });
      }
    });

    // Sort by score and return top recommendations
    return Array.from(combinedRecs.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

module.exports = new RecommendationEngine();