const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');
const { sendBookingConfirmation } = require('../utils/emailService');

// Lazy require to allow startup without stripe in dev until installed
let stripe;
function getStripe() {
	if (!stripe) {
		const secret = process.env.STRIPE_SECRET_KEY;
		if (!secret) {
			throw new Error('Missing STRIPE_SECRET_KEY in environment');
		}
		// eslint-disable-next-line global-require
		stripe = require('stripe')(secret);
	}
	return stripe;
}

// PayPal SDK
let paypal;
function getPayPalClient() {
	if (!paypal) {
		const clientId = process.env.PAYPAL_CLIENT_ID;
		const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
		if (!clientId || !clientSecret) {
			throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in environment');
		}
		const { core } = require('@paypal/checkout-server-sdk');
		paypal = new core.PayPalHttpClient(
			new core.SandboxEnvironment(clientId, clientSecret) // Use LiveEnvironment for production
		);
	}
	return paypal;
}

router.post('/create-checkout-session', async (req, res) => {
	try {
		const { items, customerEmail, metadata } = req.body || {};
		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: 'No items provided' });
		}

		const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
		const successUrl = `${origin}/result?success=true`;
		const cancelUrl = `${origin}/result?success=false`;

		const lineItems = items.map((it) => ({
			price_data: {
				currency: 'usd',
				product_data: { name: it.title || 'Experience' },
				unit_amount: Math.round((it.price || 0) * 100),
			},
			quantity: it.quantity || 1,
		}));

		const session = await getStripe().checkout.sessions.create({
			mode: 'payment',
			payment_method_types: ['card'],
			line_items: lineItems,
			success_url: successUrl,
			cancel_url: cancelUrl,
			customer_email: customerEmail,
			metadata: metadata || {},
		});

		return res.json({ id: session.id, url: session.url });
	} catch (err) {
		console.error('Stripe session error', err);
		return res.status(500).json({ message: 'Failed to create checkout session' });
	}
});

// PayPal order creation
router.post('/create-paypal-order', async (req, res) => {
	try {
		const { items, customerEmail, metadata } = req.body || {};
		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: 'No items provided' });
		}

		const { core, orders } = require('@paypal/checkout-server-sdk');
		const request = new orders.OrdersCreateRequest();
		request.prefer("return=representation");
		request.requestBody({
			intent: 'CAPTURE',
			purchase_units: items.map((it) => ({
				amount: {
					currency_code: 'INR', // Use INR for rupees
					value: (it.price * it.quantity).toFixed(2),
				},
				description: it.title || 'Experience',
			})),
			application_context: {
				brand_name: 'BookIt',
				user_action: 'PAY_NOW',
			},
		});

		const order = await getPayPalClient().execute(request);
		return res.json({ id: order.result.id });
	} catch (err) {
		console.error('PayPal order creation error', err);
		return res.status(500).json({ message: 'Failed to create PayPal order' });
	}
});

// PayPal order capture
router.post('/capture-paypal-order', async (req, res) => {
	try {
		const { orderID, metadata } = req.body;
		if (!orderID) {
			return res.status(400).json({ message: 'Order ID required' });
		}

		const { core, orders } = require('@paypal/checkout-server-sdk');
		const request = new orders.OrdersCaptureRequest(orderID);
		request.requestBody({});

		const capture = await getPayPalClient().execute(request);

		// Create booking after successful capture
		const md = metadata || {};
		const experienceId = md.experienceId;
		const slotDate = md.slotDate;
		const slotTime = md.slotTime;
		const userName = md.userName;
		const userEmail = md.userEmail;
		const quantity = Number(md.quantity || 1);

		if (experienceId && slotDate && slotTime && userName && userEmail && quantity) {
			const sessionDb = await mongoose.startSession();
			sessionDb.startTransaction();
			try {
				const experience = await Experience.findOne({ _id: experienceId }).session(sessionDb);
				if (!experience) throw new Error('Experience not found');
				const slotIndex = experience.slots.findIndex(s => s.date === slotDate && s.time === slotTime);
				if (slotIndex === -1) throw new Error('Slot not found');
				const slot = experience.slots[slotIndex];
				if (slot.bookedCount + quantity > slot.capacity) throw new Error('Not enough seats');
				const updateResult = await Experience.updateOne(
					{ _id: experienceId, [`slots.${slotIndex}.date`]: slotDate, [`slots.${slotIndex}.time`]: slotTime, [`slots.${slotIndex}.bookedCount`]: { $lte: slot.capacity - quantity } },
					{ $inc: { [`slots.${slotIndex}.bookedCount`]: quantity } }
				).session(sessionDb);
				if (updateResult.modifiedCount === 0) throw new Error('Failed to reserve seats');
				const totalPrice = experience.price * quantity;
				const booking = await Booking.create([{ experience: experienceId, slotDate, slotTime, userName, userEmail, quantity, totalPrice }], { session: sessionDb });
				await sessionDb.commitTransaction();
				sessionDb.endSession();

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
						bookingId: booking[0]._id.toString(),
						experienceLocation: experience.location || 'Location TBA'
					};
					await sendBookingConfirmation(bookingData);
				} catch (emailError) {
					console.error('Failed to send confirmation email:', emailError);
					// Don't fail the booking if email fails
				}

				// Emit real-time updates
				const io = req.app.get('io');
				if (io) {
					// Notify the user about their new booking (we don't have user ID here, so we'll skip user-specific notification)
					// Notify all users viewing this experience about availability change
					io.to(`experience_${experienceId}`).emit('availability-updated', {
						experienceId,
						slotDate,
						slotTime,
						bookedCount: slot.bookedCount + quantity
					});
				}

				return res.json({ success: true, booking: booking[0] });
			} catch (e) {
				await sessionDb.abortTransaction();
				sessionDb.endSession();
				console.error('Booking finalize error', e.message);
				return res.status(500).json({ message: 'Booking failed after payment' });
			}
		} else {
			return res.status(400).json({ message: 'Missing booking metadata' });
		}
	} catch (err) {
		console.error('PayPal capture error', err);
		return res.status(500).json({ message: 'Failed to capture PayPal order' });
	}
});

module.exports = router;


