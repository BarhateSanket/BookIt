const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Waitlist = require('../models/Waitlist');
const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const { sendBookingConfirmation } = require('../utils/emailService');

// Middleware to verify user token
const verifyUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key-here-change-in-production');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// GET /api/waitlist - Get user's waitlist entries
router.get('/', verifyUser, async (req, res) => {
  try {
    const waitlist = await Waitlist.find({ user: req.user.id })
      .populate('experience')
      .sort({ createdAt: -1 });

    res.json({ success: true, waitlist });
  } catch (err) {
    console.error('Get waitlist error:', err);
    res.status(500).json({ success: false, message: 'Failed to get waitlist' });
  }
});

// POST /api/waitlist - Add to waitlist
router.post('/', verifyUser, async (req, res) => {
  try {
    const { experienceId, slotDate, slotTime, quantity } = req.body;

    if (!experienceId || !slotDate || !slotTime || !quantity) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if already on waitlist for this slot
    const existing = await Waitlist.findOne({
      experience: experienceId,
      user: req.user.id,
      slotDate,
      slotTime,
      status: 'waiting'
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Already on waitlist for this slot' });
    }

    // Get user info
    const user = JSON.parse(require('fs').readFileSync('./user_data.json', 'utf8')).find(u => u.id === req.user.id);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const waitlistEntry = await Waitlist.create({
      experience: experienceId,
      user: req.user.id,
      slotDate,
      slotTime,
      quantity,
      userName: user.name,
      userEmail: user.email
    });

    res.json({ success: true, waitlistEntry });
  } catch (err) {
    console.error('Add to waitlist error:', err);
    res.status(500).json({ success: false, message: 'Failed to add to waitlist' });
  }
});

// DELETE /api/waitlist/:id - Remove from waitlist
router.delete('/:id', verifyUser, async (req, res) => {
  try {
    const waitlistEntry = await Waitlist.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
      status: 'waiting'
    });

    if (!waitlistEntry) {
      return res.status(404).json({ success: false, message: 'Waitlist entry not found' });
    }

    res.json({ success: true, message: 'Removed from waitlist' });
  } catch (err) {
    console.error('Remove from waitlist error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove from waitlist' });
  }
});

// POST /api/waitlist/:id/accept - Accept waitlist offer
router.post('/:id/accept', verifyUser, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const waitlistEntry = await Waitlist.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: 'offered'
    }).session(session);

    if (!waitlistEntry) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Waitlist offer not found or expired' });
    }

    // Check if slots are still available
    const experience = await Experience.findById(waitlistEntry.experience).session(session);
    if (!experience) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }

    const slotIndex = experience.slots.findIndex(s => s.date === waitlistEntry.slotDate && s.time === waitlistEntry.slotTime);
    if (slotIndex === -1) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    const slot = experience.slots[slotIndex];
    if (slot.bookedCount + waitlistEntry.quantity > slot.capacity) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Not enough seats available' });
    }

    // Reserve the seats
    const updateResult = await Experience.updateOne(
      { _id: experience._id, [`slots.${slotIndex}.date`]: waitlistEntry.slotDate, [`slots.${slotIndex}.time`]: waitlistEntry.slotTime, [`slots.${slotIndex}.bookedCount`]: { $lte: slot.capacity - waitlistEntry.quantity } },
      { $inc: { [`slots.${slotIndex}.bookedCount`]: waitlistEntry.quantity } }
    ).session(session);

    if (updateResult.modifiedCount === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Failed to reserve seats' });
    }

    // Create booking
    const totalPrice = experience.price * waitlistEntry.quantity;
    const booking = await Booking.create([{
      experience: experience._id,
      user: req.user.id,
      slotDate: waitlistEntry.slotDate,
      slotTime: waitlistEntry.slotTime,
      userName: waitlistEntry.userName,
      userEmail: waitlistEntry.userEmail,
      quantity: waitlistEntry.quantity,
      totalPrice
    }], { session });

    // Update waitlist status
    waitlistEntry.status = 'booked';
    waitlistEntry.updatedAt = new Date();
    await waitlistEntry.save({ session });

    await session.commitTransaction();

    // Send confirmation email
    try {
      const bookingData = {
        userName: waitlistEntry.userName,
        userEmail: waitlistEntry.userEmail,
        experienceTitle: experience.title,
        slotDate: waitlistEntry.slotDate,
        slotTime: waitlistEntry.slotTime,
        quantity: waitlistEntry.quantity,
        quantityLabel: waitlistEntry.quantity > 1 ? 'people' : 'person',
        totalPrice: totalPrice.toFixed(2),
        bookingId: booking[0]._id.toString(),
        experienceLocation: experience.location || 'Location TBA'
      };
      await sendBookingConfirmation(bookingData);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.json({ success: true, booking: booking[0] });
  } catch (err) {
    await session.abortTransaction();
    console.error('Accept waitlist offer error:', err);
    res.status(500).json({ success: false, message: 'Failed to accept offer' });
  } finally {
    session.endSession();
  }
});

// POST /api/waitlist/:id/decline - Decline waitlist offer
router.post('/:id/decline', verifyUser, async (req, res) => {
  try {
    const waitlistEntry = await Waitlist.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, status: 'offered' },
      { status: 'expired', updatedAt: new Date() }
    );

    if (!waitlistEntry) {
      return res.status(404).json({ success: false, message: 'Waitlist offer not found' });
    }

    res.json({ success: true, message: 'Offer declined' });
  } catch (err) {
    console.error('Decline waitlist offer error:', err);
    res.status(500).json({ success: false, message: 'Failed to decline offer' });
  }
});

// POST /api/waitlist/process - Process waitlist for available slots (called when bookings are cancelled)
router.post('/process', async (req, res) => {
  try {
    const { experienceId, slotDate, slotTime, availableSeats } = req.body;

    if (!experienceId || !slotDate || !slotTime || !availableSeats) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Find waiting users for this slot, ordered by priority then creation time
    const waitlistEntries = await Waitlist.find({
      experience: experienceId,
      slotDate,
      slotTime,
      status: 'waiting'
    }).sort({ priority: -1, createdAt: 1 }).limit(availableSeats);

    let processed = 0;
    for (const entry of waitlistEntries) {
      if (processed >= availableSeats) break;

      // Offer the spot
      entry.status = 'offered';
      entry.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours to respond
      entry.updatedAt = new Date();
      await entry.save();

      // TODO: Send email notification about the offer
      processed++;
    }

    res.json({ success: true, processed });
  } catch (err) {
    console.error('Process waitlist error:', err);
    res.status(500).json({ success: false, message: 'Failed to process waitlist' });
  }
});

module.exports = router;