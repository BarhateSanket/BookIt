const express = require('express');
const router = express.Router();
const Experience = require('../models/Experience');

// GET /api/experiences
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      priceMin,
      priceMax,
      rating,
      duration,
      location,
      latitude,
      longitude,
      radius,
      availability,
      limit = 50,
      skip = 0
    } = req.query;

    let query = {};

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }

    // Rating filter
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    // Duration filter
    if (duration) {
      query.duration = duration;
    }

    // Location text search
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Geo-spatial search
    if (latitude && longitude && radius) {
      query.latitude = {
        $gte: parseFloat(latitude) - (parseFloat(radius) / 111.32), // rough km to degrees
        $lte: parseFloat(latitude) + (parseFloat(radius) / 111.32)
      };
      query.longitude = {
        $gte: parseFloat(longitude) - (parseFloat(radius) / (111.32 * Math.cos(parseFloat(latitude) * Math.PI / 180))),
        $lte: parseFloat(longitude) + (parseFloat(radius) / (111.32 * Math.cos(parseFloat(latitude) * Math.PI / 180)))
      };
    }

    // Availability filter (simplified - check if any slots have capacity)
    if (availability === 'true') {
      query.slots = {
        $elemMatch: {
          $expr: { $lt: ['$bookedCount', '$capacity'] }
        }
      };
    }

    const list = await Experience.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ rating: -1, price: 1 }); // Sort by rating desc, then price asc

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
