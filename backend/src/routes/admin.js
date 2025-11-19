const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Waitlist = require('../models/Waitlist');

// Middleware to verify admin access (simplified for demo)
const verifyAdmin = (req, res, next) => {
  // In a real app, you'd check for admin role/token
  // For now, we'll allow access for any authenticated user
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// GET /api/admin/dashboard - Main dashboard data
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Basic metrics
    const [
      totalBookings,
      todayBookings,
      monthlyBookings,
      totalRevenue,
      monthlyRevenue,
      totalUsers,
      activeChats,
      waitlistCount
    ] = await Promise.all([
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ createdAt: { $gte: startOfDay }, status: 'confirmed' }),
      Booking.countDocuments({ createdAt: { $gte: startOfMonth }, status: 'confirmed' }),
      Booking.aggregate([
        { $match: { status: 'confirmed', paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: 'confirmed', paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      User.countDocuments(),
      Chat.countDocuments({ status: 'active' }),
      Waitlist.countDocuments({ status: 'waiting' })
    ]);

    // Revenue by month (last 12 months)
    const revenueByMonth = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Popular experiences
    const popularExperiences = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$experience', count: { $sum: '$quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'experiences',
          localField: '_id',
          foreignField: '_id',
          as: 'experience'
        }
      },
      { $unwind: '$experience' }
    ]);

    // Recent bookings
    const recentBookings = await Booking.find({ status: 'confirmed' })
      .populate('experience')
      .populate('user')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        metrics: {
          totalBookings: totalBookings || 0,
          todayBookings: todayBookings || 0,
          monthlyBookings: monthlyBookings || 0,
          totalRevenue: totalRevenue[0]?.total || 0,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          totalUsers: totalUsers || 0,
          activeChats: activeChats || 0,
          waitlistCount: waitlistCount || 0
        },
        charts: {
          revenueByMonth,
          popularExperiences
        },
        recentBookings
      }
    });
  } catch (err) {
    console.error('Dashboard data error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard data' });
  }
});

// GET /api/admin/bookings - Bookings management
router.get('/bookings', verifyAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('experience')
      .populate('user')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Bookings management error:', err);
    res.status(500).json({ success: false, message: 'Failed to load bookings' });
  }
});

// PUT /api/admin/bookings/:id - Update booking status
router.put('/bookings/:id', verifyAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, notes, updatedAt: new Date() },
      { new: true }
    ).populate('experience');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

// GET /api/admin/users - User management
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Add booking stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookingCount = await Booking.countDocuments({ user: user._id });
        const totalSpent = await Booking.aggregate([
          { $match: { user: user._id, status: 'confirmed', paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        return {
          ...user.toObject(),
          stats: {
            bookingCount,
            totalSpent: totalSpent[0]?.total || 0
          }
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Users management error:', err);
    res.status(500).json({ success: false, message: 'Failed to load users' });
  }
});

// GET /api/admin/performance - System performance metrics
router.get('/performance', verifyAdmin, async (req, res) => {
  try {
    // System uptime (simplified)
    const uptime = process.uptime();

    // Database connection status
    const dbStatus = 'connected'; // In real app, check actual DB status

    // Recent errors (simplified - in real app, you'd have error logging)
    const recentErrors = [];

    // API response times (simplified)
    const avgResponseTime = 150; // ms

    res.json({
      success: true,
      performance: {
        uptime,
        dbStatus,
        recentErrors,
        avgResponseTime,
        serverLoad: process.cpuUsage(),
        memoryUsage: process.memoryUsage()
      }
    });
  } catch (err) {
    console.error('Performance metrics error:', err);
    res.status(500).json({ success: false, message: 'Failed to load performance metrics' });
  }
});

module.exports = router;