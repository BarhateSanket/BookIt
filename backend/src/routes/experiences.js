const express = require('express');
const router = express.Router();
const Experience = require('../models/Experience');

// GET /api/experiences
router.get('/', async (req, res) => {
  try {
    const list = await Experience.find({});
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/experiences/:id
router.get('/:id', async (req, res) => {
  try {
    const exp = await Experience.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: 'Experience not found' });
    res.json(exp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
