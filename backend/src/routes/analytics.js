const express = require('express');
const router = express.Router();
const analyticsEngine = require('../utils/analytics');

// Get Customer Lifetime Value (CLV) analytics
router.get('/clv', async (req, res) => {
  try {
    const { timeframe = 'all' } = req.query;

    const clvData = await analyticsEngine.calculateCLV(null, timeframe);

    if (!clvData) {
      return res.status(500).json({ message: 'Failed to calculate CLV' });
    }

    res.json({
      success: true,
      data: clvData
    });

  } catch (error) {
    console.error('Error fetching CLV analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Customer Lifetime Value (CLV) analytics for specific user
router.get('/clv/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = 'all' } = req.query;

    const clvData = await analyticsEngine.calculateCLV(userId, timeframe);

    if (!clvData) {
      return res.status(500).json({ message: 'Failed to calculate CLV' });
    }

    res.json({
      success: true,
      data: clvData
    });

  } catch (error) {
    console.error('Error fetching CLV analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversion funnel analytics
router.get('/funnel', async (req, res) => {
  try {
    const { timeframe = '30days' } = req.query;

    const funnelData = await analyticsEngine.calculateConversionFunnel(timeframe);

    if (!funnelData) {
      return res.status(500).json({ message: 'Failed to calculate conversion funnel' });
    }

    res.json({
      success: true,
      data: funnelData
    });

  } catch (error) {
    console.error('Error fetching conversion funnel:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get business intelligence reports
router.get('/business-intelligence', async (req, res) => {
  try {
    const { timeframe = '30days' } = req.query;

    const biData = await analyticsEngine.getBusinessIntelligence(timeframe);

    if (!biData) {
      return res.status(500).json({ message: 'Failed to generate business intelligence report' });
    }

    res.json({
      success: true,
      data: biData
    });

  } catch (error) {
    console.error('Error fetching business intelligence:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { timeframe = '30days' } = req.query;

    const metrics = await analyticsEngine.getPerformanceMetrics(timeframe);

    if (!metrics) {
      return res.status(500).json({ message: 'Failed to get performance metrics' });
    }

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comprehensive dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { timeframe = '30days' } = req.query;

    const [clvData, funnelData, biData, metrics] = await Promise.all([
      analyticsEngine.calculateCLV(null, timeframe),
      analyticsEngine.calculateConversionFunnel(timeframe),
      analyticsEngine.getBusinessIntelligence(timeframe),
      analyticsEngine.getPerformanceMetrics(timeframe)
    ]);

    res.json({
      success: true,
      dashboard: {
        clv: clvData,
        funnel: funnelData,
        businessIntelligence: biData,
        performance: metrics,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue trends over time
router.get('/revenue-trends', async (req, res) => {
  try {
    const { period = 'monthly', months = 12 } = req.query;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - parseInt(months), 1);

    const revenueTrends = await require('../models/Booking').aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' }
                }
              }
            ]
          },
          revenue: 1,
          bookings: 1,
          uniqueCustomers: { $size: '$uniqueCustomers' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      trends: revenueTrends
    });

  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user acquisition and retention metrics
router.get('/user-metrics', async (req, res) => {
  try {
    const { timeframe = '90days' } = req.query;

    const now = new Date();
    const periods = {
      '30days': 30,
      '90days': 90,
      '1year': 365
    };
    const days = periods[timeframe] || 90;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    // New user registrations
    const newUsers = await require('../models/User').countDocuments({
      createdAt: { $gte: startDate }
    });

    // Active users (users with recent activity)
    const activeUsers = await require('../models/User').countDocuments({
      updatedAt: { $gte: startDate }
    });

    // Returning users (users with multiple bookings)
    const returningUsers = await require('../models/Booking').aggregate([
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
        $count: 'returningCount'
      }
    ]);

    const returningCount = returningUsers.length > 0 ? returningUsers[0].returningCount : 0;

    // User retention rate
    const retentionRate = newUsers > 0 ? (returningCount / newUsers * 100).toFixed(1) : 0;

    res.json({
      success: true,
      userMetrics: {
        timeframe,
        newUsers,
        activeUsers,
        returningUsers: returningCount,
        retentionRate: `${retentionRate}%`
      }
    });

  } catch (error) {
    console.error('Error fetching user metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;