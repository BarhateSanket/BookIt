const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');

let stripe;
function getStripe() {
	if (!stripe) {
		const secret = process.env.STRIPE_SECRET_KEY;
		if (!secret) throw new Error('Missing STRIPE_SECRET_KEY');
		// eslint-disable-next-line global-require
		stripe = require('stripe')(secret);
	}
	return stripe;
}

const router = express.Router();

router.post('/', async (req, res) => {
	const sig = req.headers['stripe-signature'];
	const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!endpointSecret) return res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');

	let event;
	try {
		event = getStripe().webhooks.constructEvent(req.body, sig, endpointSecret);
	} catch (err) {
		console.error('Webhook signature verification failed', err.message);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		const md = session.metadata || {};
		const experienceId = md.experienceId;
		const slotDate = md.slotDate;
		const slotTime = md.slotTime;
		const userName = md.userName;
		const userEmail = session.customer_details?.email || md.userEmail;
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
				await Booking.create([{ experience: experienceId, slotDate, slotTime, userName, userEmail, quantity, totalPrice }], { session: sessionDb });
				await sessionDb.commitTransaction();
				sessionDb.endSession();
			} catch (e) {
				await sessionDb.abortTransaction();
				sessionDb.endSession();
				console.error('Booking finalize error', e.message);
			}
		}
	}

	return res.json({ received: true });
});

module.exports = router;


