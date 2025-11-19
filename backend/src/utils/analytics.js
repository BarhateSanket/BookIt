const User = require('../models/User');
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');
const Review = require('../models/Review');

class AnalyticsEngine {
  // Calculate Customer Lifetime Value (CLV)
  async calculateCLV(userId = null, timeframe = 'all') {
    try {
      let dateFilter = {};
      if (timeframe !== 'all') {
        const now = new Date();
        const periods = {
          '30days': 30,
          '90days': 90,
          '1year': 365
        };
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - (periods[timeframe] * 24 * 60 * 60 * 1000))
        };
      }

      let matchCondition = dateFilter;
      if (userId) {
        matchCondition.user = userId;
      }

      const clvData = await Booking.aggregate([
        { $match: { ...matchCondition, status: { $in: ['confirmed', 'completed'] } } },
        {
          $group: {
            _id: userId ? null : '$user',
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            firstBooking: { $min: '$createdAt' },
            lastBooking: { $max: '$createdAt' },
            averageOrderValue: { $avg: '$totalPrice' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $project: {
            userId: '$_id',
            totalBookings: 1,
            totalRevenue: 1,
            firstBooking: 1,
            lastBooking: 1,
            averageOrderValue: 1,
            customerLifetime: {
              $divide: [
                { $subtract: ['$lastBooking', '$firstBooking'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            },
            userInfo: { $arrayElemAt: ['$userInfo', 0] }
          }
        }
      ]);

      if (userId && clvData.length > 0) {
        const data = clvData[0];
        const purchaseFrequency = data.totalBookings / Math.max(data.customerLifetime, 1);
        const clv = data.averageOrderValue * purchaseFrequency * 365; // Annual CLV

        return {
          userId: data.userId,
          totalRevenue: data.totalRevenue,
          totalBookings: data.totalBookings,
          averageOrderValue: data.averageOrderValue,
          customerLifetime: data.customerLifetime,
          purchaseFrequency: purchaseFrequency,
          clv: clv,
          clvSegment: this.getCLVSegment(clv)
        };
      }

      // Aggregate CLV for all users
      const totalUsers = await User.countDocuments();
      const totalRevenue = clvData.reduce((sum, user) => sum + user.totalRevenue, 0);
      const averageCLV = clvData.length > 0 ? clvData.reduce((sum, user) => sum + (user.averageOrderValue * (user.totalBookings / Math.max(user.customerLifetime, 1)) * 365), 0) / clvData.length : 0;

      return {
        totalUsers,
        totalRevenue,
        averageCLV,
        clvDistribution: this.calculateCLVDistribution(clvData)
      };

    } catch (error) {
      console.error('Error calculating CLV:', error);
      return null;
    }
  }

  // Get CLV segment
  getCLVSegment(clv) {
    if (clv >= 1000) return 'High Value';
    if (clv >= 500) return 'Medium Value';
    if (clv >= 100) return 'Low Value';
    return 'New Customer';
  }

  // Calculate CLV distribution
  calculateCLVDistribution(clvData) {
    const segments = {
      'High Value': 0,
      'Medium Value': 0,
      'Low Value': 0,
      'New Customer': 0
    };

    clvData.forEach(user => {
      const purchaseFrequency = user.totalBookings / Math.max(user.customerLifetime, 1);
      const clv = user.averageOrderValue * purchaseFrequency * 365;
      const segment = this.getCLVSegment(clv);
      segments[segment]++;
    });

    return segments;
  }

  // Calculate conversion funnel
  async calculateConversionFunnel(timeframe = '30days') {
    try {
      const now = new Date();
      const periods = {
        '7days': 7,
        '30days': 30,
        '90days': 90
      };
      const days = periods[timeframe] || 30;
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

      // Step 1: Website visitors (simplified - using user registrations as proxy)
      const registrations = await User.countDocuments({
        createdAt: { $gte: startDate }
      });

      // Step 2: Experience viewers (users who have viewed experiences - approximated by favorites/bookings)
      const activeUsers = await User.countDocuments({
        $or: [
          { favorites: { $exists: true, $ne: [] } },
          { savedSearches: { $exists: true, $ne: [] } }
        ],
        createdAt: { $gte: startDate }
      });

      // Step 3: Booking initiations (all bookings)
      const bookingInitiations = await Booking.countDocuments({
        createdAt: { $gte: startDate }
      });

      // Step 4: Completed bookings
      const completedBookings = await Booking.countDocuments({
        createdAt: { $gte: startDate },
        status: { $in: ['confirmed', 'completed'] }
      });

      // Step 5: Paid bookings (assuming all confirmed are paid)
      const paidBookings = completedBookings;

      // Step 6: Repeat customers
      const repeatCustomers = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'completed'] }
          }
        },
        {
          $group: {
            _id: '$user',
            bookingCount: { $sum: 1 }
          }
        },
        {
          $match: { bookingCount: { $gt: 1 } }
        },
        {
          $count: 'repeatCount'
        }
      ]);

      const repeatCount = repeatCustomers.length > 0 ? repeatCustomers[0].repeatCount : 0;

      return {
        timeframe,
        funnel: {
          registrations: {
            count: registrations,
            percentage: 100
          },
          experienceViewers: {
            count: activeUsers,
            percentage: registrations > 0 ? (activeUsers / registrations * 100).toFixed(1) : 0
          },
          bookingInitiations: {
            count: bookingInitiations,
            percentage: activeUsers > 0 ? (bookingInitiations / activeUsers * 100).toFixed(1) : 0
          },
          completedBookings: {
            count: completedBookings,
            percentage: bookingInitiations > 0 ? (completedBookings / bookingInitiations * 100).toFixed(1) : 0
          },
          paidBookings: {
            count: paidBookings,
            percentage: completedBookings > 0 ? (paidBookings / completedBookings * 100).toFixed(1) : 0
          },
          repeatCustomers: {
            count: repeatCount,
            percentage: paidBookings > 0 ? (repeatCount / paidBookings * 100).toFixed(1) : 0
          }
        }
      };

    } catch (error) {
      console.error('Error calculating conversion funnel:', error);
      return null;
    }
  }

  // Get business intelligence reports
  async getBusinessIntelligence(timeframe = '30days') {
    try {
      const now = new Date();
      const periods = {
        '7days': 7,
        '30days': 30,
        '90days': 90,
        '1year': 365
      };
      const days = periods[timeframe] || 30;
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

      // Revenue metrics
      const revenueData = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            totalBookings: { $sum: 1 },
            averageOrderValue: { $avg: '$totalPrice' },
            uniqueCustomers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            totalRevenue: 1,
            totalBookings: 1,
            averageOrderValue: 1,
            uniqueCustomers: { $size: '$uniqueCustomers' }
          }
        }
      ]);

      const revenue = revenueData.length > 0 ? revenueData[0] : {
        totalRevenue: 0,
        totalBookings: 0,
        averageOrderValue: 0,
        uniqueCustomers: 0
      };

      // Experience performance
      const experiencePerformance = await Experience.aggregate([
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'experience',
            as: 'bookings',
            pipeline: [
              {
                $match: {
                  createdAt: { $gte: startDate },
                  status: { $in: ['confirmed', 'completed'] }
                }
              }
            ]
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
          $project: {
            title: 1,
            category: 1,
            price: 1,
            rating: 1,
            totalBookings: { $size: '$bookings' },
            totalRevenue: {
              $sum: {
                $map: {
                  input: '$bookings',
                  as: 'booking',
                  in: '$$booking.totalPrice'
                }
              }
            },
            averageRating: { $avg: '$reviews.rating' },
            reviewCount: { $size: '$reviews' }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ]);

      // Category performance
      const categoryPerformance = await Experience.aggregate([
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'experience',
            as: 'bookings',
            pipeline: [
              {
                $match: {
                  createdAt: { $gte: startDate },
                  status: { $in: ['confirmed', 'completed'] }
                }
              }
            ]
          }
        },
        {
          $group: {
            _id: '$category',
            totalExperiences: { $sum: 1 },
            totalBookings: { $sum: { $size: '$bookings' } },
            totalRevenue: {
              $sum: {
                $reduce: {
                  input: '$bookings',
                  initialValue: 0,
                  in: { $add: ['$$value', '$$this.totalPrice'] }
                }
              }
            },
            averageRating: { $avg: '$rating' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      // Geographic performance
      const geographicPerformance = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'completed'] }
          }
        },
        {
          $lookup: {
            from: 'experiences',
            localField: 'experience',
            foreignField: '_id',
            as: 'experience'
          }
        },
        {
          $unwind: '$experience'
        },
        {
          $group: {
            _id: '$experience.location',
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            uniqueCustomers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            location: '$_id',
            totalBookings: 1,
            totalRevenue: 1,
            uniqueCustomers: { $size: '$uniqueCustomers' }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ]);

      return {
        timeframe,
        revenueMetrics: revenue,
        topExperiences: experiencePerformance,
        categoryPerformance,
        geographicPerformance,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Error generating business intelligence:', error);
      return null;
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(timeframe = '30days') {
    try {
      const now = new Date();
      const periods = {
        '7days': 7,
        '30days': 30,
        '90days': 90
      };
      const days = periods[timeframe] || 30;
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

      // System performance metrics
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({
        updatedAt: { $gte: startDate }
      });

      const totalExperiences = await Experience.countDocuments({ isActive: true });
      const totalBookings = await Booking.countDocuments({
        createdAt: { $gte: startDate }
      });

      const completedBookings = await Booking.countDocuments({
        createdAt: { $gte: startDate },
        status: { $in: ['confirmed', 'completed'] }
      });

      const totalReviews = await Review.countDocuments({
        createdAt: { $gte: startDate }
      });

      // Calculate rates
      const bookingRate = totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(1) : 0;
      const userEngagementRate = totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(1) : 0;
      const reviewRate = completedBookings > 0 ? (totalReviews / completedBookings * 100).toFixed(1) : 0;

      return {
        timeframe,
        metrics: {
          totalUsers,
          activeUsers,
          userEngagementRate: `${userEngagementRate}%`,
          totalExperiences,
          totalBookings,
          completedBookings,
          bookingCompletionRate: `${bookingRate}%`,
          totalReviews,
          reviewRate: `${reviewRate}%`
        },
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return null;
    }
  }
}

module.exports = new AnalyticsEngine();