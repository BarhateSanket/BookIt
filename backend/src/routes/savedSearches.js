const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/saved-searches - Get user's saved searches
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('savedSearches');
    res.json(user.savedSearches || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/saved-searches - Save a new search
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, filters } = req.body;
    const user = await User.findById(req.user.id);

    user.savedSearches.push({ name, filters });
    await user.save();

    res.status(201).json(user.savedSearches[user.savedSearches.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/saved-searches/:id - Delete a saved search
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedSearches = user.savedSearches.filter(search => search._id.toString() !== req.params.id);
    await user.save();

    res.json({ message: 'Saved search deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
