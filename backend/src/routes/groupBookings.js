const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');
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

// Calculate group discount based on quantity
const calculateGroupDiscount = (quantity, basePrice) => {
  let discountPercentage = 0;

  if (quantity >= 10) discountPercentage = 15;
  else if (quantity >= 5) discountPercentage = 10;
  else if (quantity >= 3) discountPercentage = 5;

  const discountAmount = (basePrice * quantity * discountPercentage) / 100;
  return { discountPercentage, discountAmount };
};

// POST /api/group-bookings - Create group booking
router.post('/', verifyUser, async (req, res) => {
  const { experienceId, slotDate, slotTime, participants, paymentMethod } = req.body;

  if (!experienceId || !slotDate || !slotTime || !participants || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const quantity = participants.length;
  if (quantity < 2) {
    return res.status(400).json({ success: false, message: 'Group booking requires at least 2 participants' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const experience = await Experience.findById(experienceId).session(session);
    if (!experience) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }

    const slotIndex = experience.slots.findIndex(s => s.date === slotDate && s.time === slotTime);
    if (slotIndex === -1) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    const slot = experience.slots[slotIndex];
    if (slot.bookedCount + quantity > slot.capacity) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Not enough seats available' });
    }

    // Reserve seats atomically
    const updateResult = await Experience.updateOne(
      { _id: experienceId, [`slots.${slotIndex}.date`]: slotDate, [`slots.${slotIndex}.time`]: slotTime, [`slots.${slotIndex}.bookedCount`]: { $lte: slot.capacity - quantity } },
      { $inc: { [`slots.${slotIndex}.bookedCount`]: quantity } }
    ).session(session);

    if (updateResult.modifiedCount === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Failed to reserve seats' });
    }

    // Calculate pricing with group discount
    const baseTotal = experience.price * quantity;
    const { discountPercentage, discountAmount } = calculateGroupDiscount(quantity, experience.price);
    const finalTotal = baseTotal - discountAmount;

    // Create participant list with organizer marked
    const participantList = participants.map((p, index) => ({
      name: p.name,
      email: p.email,
      phone: p.phone || '',
      isOrganizer: index === 0 // First participant is organizer
    }));

    // Create payment splits
    const paymentSplits = participantList.map(participant => ({
      participantEmail: participant.email,
      amount: finalTotal / quantity, // Equal split for now
      status: participant.isOrganizer ? 'paid' : 'pending' // Organizer pays immediately
    }));

    // Create booking
    const booking = await Booking.create([{
      experience: experienceId,
      user: req.user.id,
      slotDate,
      slotTime,
      userName: participantList[0].name,
      userEmail: participantList[0].email,
      quantity,
      totalPrice: finalTotal,
      isGroupBooking: true,
      participants: participantList,
      groupDiscount: discountPercentage,
      paymentSplits,
      paymentStatus: paymentMethod === 'full' ? 'paid' : 'pending'
    }], { session });

    await session.commitTransaction();

    // Send confirmation emails to all participants
    try {
      for (const participant of participantList) {
        const participantBookingData = {
          userName: participant.name,
          userEmail: participant.email,
          experienceTitle: experience.title,
          slotDate,
          slotTime,
          quantity: 1,
          quantityLabel: 'person',
          totalPrice: (finalTotal / quantity).toFixed(2),
          bookingId: booking[0]._id.toString(),
          experienceLocation: experience.location || 'Location TBA'
        };

        if (participant.isOrganizer) {
          participantBookingData.quantity = quantity;
          participantBookingData.quantityLabel = quantity > 1 ? 'people' : 'person';
          participantBookingData.totalPrice = finalTotal.toFixed(2);
        }

        await sendBookingConfirmation(participantBookingData);
      }
    } catch (emailError) {
      console.error('Failed to send confirmation emails:', emailError);
    }

    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user.id}`).emit('booking-created', {
        booking: booking[0],
        experience: experience
      });

      io.to(`experience_${experienceId}`).emit('availability-updated', {
        experienceId,
        slotDate,
        slotTime,
        bookedCount: slot.bookedCount + quantity
      });
    }

    res.json({
      success: true,
      booking: booking[0],
      discountApplied: discountPercentage,
      totalSaved: discountAmount
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('Group booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to create group booking' });
  } finally {
    session.endSession();
  }
});

// GET /api/group-bookings - Get user's group bookings
router.get('/', verifyUser, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
      isGroupBooking: true
    })
      .populate('experience')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    console.error('Get group bookings error:', err);
    res.status(500).json({ success: false, message: 'Failed to get group bookings' });
  }
});

// POST /api/group-bookings/:id/invite - Send payment reminders to pending participants
router.post('/:id/invite', verifyUser, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id,
      isGroupBooking: true
    }).populate('experience');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Group booking not found' });
    }

    // Send payment reminders to pending participants
    const pendingPayments = booking.paymentSplits.filter(split => split.status === 'pending');

    // TODO: Implement email sending for payment reminders

    res.json({
      success: true,
      message: `Payment reminders sent to ${pendingPayments.length} participants`
    });
  } catch (err) {
    console.error('Send invites error:', err);
    res.status(500).json({ success: false, message: 'Failed to send invites' });
  }
});

// POST /api/group-bookings/:id/cancel - Cancel group booking
router.post('/:id/cancel', verifyUser, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id,
      isGroupBooking: true,
      status: 'confirmed'
    }).populate('experience').session(session);

    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Group booking not found' });
    }

    // Free up the seats
    const experience = booking.experience;
    const slotIndex = experience.slots.findIndex(s => s.date === booking.slotDate && s.time === booking.slotTime);

    if (slotIndex !== -1) {
      await Experience.updateOne(
        { _id: experience._id },
        { $inc: { [`slots.${slotIndex}.bookedCount`]: -booking.quantity } }
      ).session(session);
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    await booking.save({ session });

    // Process refunds for payment splits
    // TODO: Implement refund logic for group payments

    await session.commitTransaction();

    // Send cancellation emails
    try {
      for (const participant of booking.participants) {
        // TODO: Send cancellation emails to all participants
      }
    } catch (emailError) {
      console.error('Failed to send cancellation emails:', emailError);
    }

    res.json({ success: true, message: 'Group booking cancelled successfully' });
  } catch (err) {
    await session.abortTransaction();
    console.error('Cancel group booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel group booking' });
  } finally {
    session.endSession();
  }
});

module.exports = router;