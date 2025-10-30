const express = require('express');
const router = express.Router();

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

module.exports = router;


