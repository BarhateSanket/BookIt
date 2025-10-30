const express = require('express');
const router = express.Router();
const Promo = require('../models/Promo');

// POST /api/promo/validate
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'Code required' });
    const promo = await Promo.findOne({ code: code.toUpperCase(), active: true });
    if (!promo) return res.json({ valid: false });
    res.json({ valid: true, promo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
