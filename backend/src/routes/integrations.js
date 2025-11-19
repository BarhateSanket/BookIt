const express = require('express');
const router = express.Router();
const integrations = require('../utils/integrations');
const Booking = require('../models/Booking');
const Experience = require('../models/Experience');

// Google Calendar Integration
router.get('/google-calendar/auth-url', (req, res) => {
  try {
    const authUrl = integrations.getGoogleAuthUrl();
    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Error getting Google auth URL:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/google-calendar/exchange-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    const tokens = await integrations.exchangeGoogleCodeForTokens(code);

    if (!tokens.success) {
      return res.status(400).json({ message: tokens.error });
    }

    res.json({
      success: true,
      tokens
    });

  } catch (error) {
    console.error('Error exchanging Google code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/google-calendar/sync-booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Access token is required' });
    }

    const booking = await Booking.findById(bookingId).populate('experience');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const result = await integrations.syncToGoogleCalendar(booking, { googleAccessToken: accessToken });

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      success: true,
      calendarEvent: result
    });

  } catch (error) {
    console.error('Error syncing to Google Calendar:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Weather Integration
router.get('/weather/:experienceId/:slotDate/:slotTime', async (req, res) => {
  try {
    const { experienceId, slotDate, slotTime } = req.params;

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const weather = await integrations.getWeatherForLocation(experience.location, slotDate);

    if (!weather.success) {
      return res.status(400).json({ message: weather.error });
    }

    res.json({
      success: true,
      weather: weather.weather,
      experience: {
        id: experience._id,
        title: experience.title,
        location: experience.location
      }
    });

  } catch (error) {
    console.error('Error getting weather:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Social Media Sharing
router.post('/share/facebook/:experienceId', async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { accessToken, bookingId } = req.body;

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
    }

    const content = integrations.generateSharingContent(experience, booking);
    const result = await integrations.shareToFacebook(content, accessToken);

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      success: true,
      share: result
    });

  } catch (error) {
    console.error('Error sharing to Facebook:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/share/twitter/:experienceId', async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { bookingId } = req.body;

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
    }

    const content = integrations.generateSharingContent(experience, booking);
    const result = await integrations.shareToTwitter(content);

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      success: true,
      share: result
    });

  } catch (error) {
    console.error('Error sharing to Twitter:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// External Reviews Integration
router.get('/reviews/google/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;

    const reviews = await integrations.getGoogleReviews(placeId);

    if (!reviews.success) {
      return res.status(400).json({ message: reviews.error });
    }

    res.json({
      success: true,
      reviews: reviews.reviews,
      summary: {
        averageRating: reviews.averageRating,
        totalReviews: reviews.totalReviews
      }
    });

  } catch (error) {
    console.error('Error getting Google reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/reviews/yelp/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;

    const reviews = await integrations.getYelpReviews(businessId);

    if (!reviews.success) {
      return res.status(400).json({ message: reviews.error });
    }

    res.json({
      success: true,
      reviews: reviews.reviews,
      totalReviews: reviews.totalReviews
    });

  } catch (error) {
    console.error('Error getting Yelp reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search external platforms
router.get('/search/google-places', async (req, res) => {
  try {
    const { query, latitude, longitude } = req.query;

    if (!query || !latitude || !longitude) {
      return res.status(400).json({ message: 'Query, latitude, and longitude are required' });
    }

    const results = await integrations.searchGooglePlaces(query, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    });

    if (!results.success) {
      return res.status(400).json({ message: results.error });
    }

    res.json({
      success: true,
      places: results.places
    });

  } catch (error) {
    console.error('Error searching Google Places:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/search/yelp', async (req, res) => {
  try {
    const { term, location } = req.query;

    if (!term || !location) {
      return res.status(400).json({ message: 'Term and location are required' });
    }

    const results = await integrations.searchYelpBusinesses(term, location);

    if (!results.success) {
      return res.status(400).json({ message: results.error });
    }

    res.json({
      success: true,
      businesses: results.businesses
    });

  } catch (error) {
    console.error('Error searching Yelp:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sharing content for an experience
router.get('/share/content/:experienceId', async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { bookingId } = req.query;

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
    }

    const content = integrations.generateSharingContent(experience, booking);

    res.json({
      success: true,
      content
    });

  } catch (error) {
    console.error('Error generating sharing content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk operations for admin
router.post('/sync-all-bookings', async (req, res) => {
  try {
    const { userId, googleAccessToken } = req.body;

    if (!userId || !googleAccessToken) {
      return res.status(400).json({ message: 'User ID and Google access token are required' });
    }

    const bookings = await Booking.find({
      user: userId,
      status: { $in: ['confirmed', 'completed'] }
    }).populate('experience');

    const results = [];
    for (const booking of bookings) {
      try {
        const result = await integrations.syncToGoogleCalendar(booking, { googleAccessToken });
        results.push({
          bookingId: booking._id,
          success: result.success,
          eventId: result.eventId,
          error: result.error
        });
      } catch (error) {
        results.push({
          bookingId: booking._id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Synced ${successCount} out of ${results.length} bookings to Google Calendar`,
      results
    });

  } catch (error) {
    console.error('Error syncing all bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;