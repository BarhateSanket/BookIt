const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');
const mongoose = require('mongoose');

// GET /api/bookings - Get bookings for authenticated user
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key-here-change-in-production');
    const bookings = await Booking.find({ user: decoded.id })
      .populate('experience')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// POST /api/bookings
router.post('/', async (req, res) => {
  const { experienceId, slotDate, slotTime, userName, userEmail, quantity } = req.body;
  if (!experienceId || !slotDate || !slotTime || !userName || !userEmail || !quantity) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const experience = await Experience.findOne({ _id: experienceId }).session(session);
    if (!experience) throw new Error('Experience not found');

    const slotIndex = experience.slots.findIndex(s => s.date === slotDate && s.time === slotTime);
    if (slotIndex === -1) throw new Error('Slot not found');

    const slot = experience.slots[slotIndex];
    if (slot.bookedCount + quantity > slot.capacity) {
      throw new Error('Not enough seats');
    }

    // Atomic update: increment bookedCount
    const updateResult = await Experience.updateOne(
      { _id: experienceId, [`slots.${slotIndex}.date`]: slotDate, [`slots.${slotIndex}.time`]: slotTime, [`slots.${slotIndex}.bookedCount`]: { $lte: slot.capacity - quantity } },
      { $inc: { [`slots.${slotIndex}.bookedCount`]: quantity } }
    ).session(session);

    if (updateResult.modifiedCount === 0) {
      throw new Error('Failed to reserve seats (concurrent booking)');
    }

    const totalPrice = experience.price * quantity;
    const decoded = require('jsonwebtoken').verify(req.headers.authorization?.split(' ')[1], process.env.JWT_SECRET || 'your-jwt-secret-key-here-change-in-production');

    const created = await Booking.create([{
      experience: experienceId,
      user: decoded.id,
      slotDate, slotTime, userName, userEmail, quantity, totalPrice
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, booking: created[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
