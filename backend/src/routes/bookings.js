const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');
const mongoose = require('mongoose');
const { sendBookingConfirmation, sendCancellationEmail } = require('../utils/emailService');
const { createBlockchainBooking } = require('../utils/blockchain');

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
  const { experienceId, slotDate, slotTime, userName, userEmail, quantity, paymentMethod, userWalletAddress } = req.body;
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

    // Use dynamic price if available, otherwise use base price
    const slotDynamicPrice = slot.dynamicPrice || experience.price;
    const totalPrice = slotDynamicPrice * quantity;
    const decoded = require('jsonwebtoken').verify(req.headers.authorization?.split(' ')[1], process.env.JWT_SECRET || 'your-jwt-secret-key-here-change-in-production');

    const created = await Booking.create([{
      experience: experienceId,
      user: decoded.id,
      slotDate, slotTime, userName, userEmail, quantity, totalPrice,
      paymentMethod: paymentMethod || 'paypal',
      userWalletAddress
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Send confirmation email
    try {
      const bookingData = {
        userName: userName,
        userEmail: userEmail,
        experienceTitle: experience.title,
        slotDate: slotDate,
        slotTime: slotTime,
        quantity: quantity,
        quantityLabel: quantity > 1 ? 'people' : 'person',
        totalPrice: totalPrice.toFixed(2),
        bookingId: created[0]._id.toString(),
        experienceLocation: experience.location || 'Location TBA'
      };
      await sendBookingConfirmation(bookingData);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    // Handle blockchain booking if payment method is crypto
    if (paymentMethod === 'crypto' && userWalletAddress) {
      try {
        // For demo, use a fixed private key (in production, user should sign)
        const signerPrivateKey = process.env.PLATFORM_PRIVATE_KEY || '0x...'; // Replace with actual
        const dateTimestamp = new Date(slotDate + ' ' + slotTime).getTime() / 1000;
        const txHash = await createBlockchainBooking(experienceId, Math.floor(dateTimestamp), totalPrice, signerPrivateKey);
        // Update booking with tx hash
        created[0].blockchainTxHash = txHash;
        // Assume tokenId is 1 for demo
        created[0].nftTokenId = '1'; // In real, parse from event
        await created[0].save();
      } catch (blockchainError) {
        console.error('Failed to create blockchain booking:', blockchainError);
        // Don't fail the booking
      }
    }

    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      // Notify the user about their new booking
      io.to(`user_${decoded.id}`).emit('booking-created', {
        booking: created[0],
        experience: experience
      });

      // Notify all users viewing this experience about availability change
      io.to(`experience_${experienceId}`).emit('availability-updated', {
        experienceId,
        slotDate,
        slotTime,
        bookedCount: slot.bookedCount + quantity
      });
    }

    res.json({ success: true, booking: created[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/bookings/:id/cancel - Cancel a booking
router.put('/:id/cancel', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key-here-change-in-production');
    const bookingId = req.params.id;

    const booking = await Booking.findOne({ _id: bookingId, user: decoded.id }).populate('experience');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    await booking.save();

    // Send cancellation email
    try {
      const bookingData = {
        userName: booking.userName,
        userEmail: booking.userEmail,
        experienceTitle: booking.experience.title,
        slotDate: booking.slotDate,
        slotTime: booking.slotTime,
        quantity: booking.quantity,
        quantityLabel: booking.quantity > 1 ? 'people' : 'person',
        bookingId: booking._id.toString(),
        experienceLocation: booking.experience.location || 'Location TBA'
      };
      await sendCancellationEmail(bookingData);
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the cancellation if email fails
    }

    // Process waitlist for the freed up slots
    try {
      const availableSeats = booking.quantity; // Seats that became available
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/waitlist/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experienceId: booking.experience._id,
          slotDate: booking.slotDate,
          slotTime: booking.slotTime,
          availableSeats
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Processed ${result.processed} waitlist entries`);
      }
    } catch (waitlistError) {
      console.error('Failed to process waitlist:', waitlistError);
      // Don't fail the cancellation if waitlist processing fails
    }

    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      // Notify the user about booking cancellation
      io.to(`user_${decoded.id}`).emit('booking-cancelled', {
        booking: booking
      });

      // Notify all users viewing this experience about availability change (seats freed up)
      io.to(`experience_${booking.experience._id}`).emit('availability-updated', {
        experienceId: booking.experience._id,
        slotDate: booking.slotDate,
        slotTime: booking.slotTime,
        bookedCount: booking.experience.slots.find(s => s.date === booking.slotDate && s.time === booking.slotTime)?.bookedCount - booking.quantity || 0
      });
    }

    res.json({ success: true, message: 'Booking cancelled successfully', booking });
  } catch (err) {
    console.error('Cancellation error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
});

module.exports = router;
