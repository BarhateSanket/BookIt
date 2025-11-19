const axios = require('axios');

class ThirdPartyIntegrations {
  constructor() {
    this.googleCalendarApiKey = process.env.GOOGLE_CALENDAR_API_KEY;
    this.googleCalendarClientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    this.googleCalendarClientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

    this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY;

    this.facebookAppId = process.env.FACEBOOK_APP_ID;
    this.facebookAppSecret = process.env.FACEBOOK_APP_SECRET;

    this.twitterApiKey = process.env.TWITTER_API_KEY;
    this.twitterApiSecret = process.env.TWITTER_API_SECRET;
    this.twitterAccessToken = process.env.TWITTER_ACCESS_TOKEN;
    this.twitterAccessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

    this.googleReviewsApiKey = process.env.GOOGLE_REVIEWS_API_KEY;
    this.yelpApiKey = process.env.YELP_API_KEY;
  }

  // Google Calendar Integration
  async syncToGoogleCalendar(booking, userTokens) {
    try {
      const event = {
        summary: `BookIt: ${booking.experience.title}`,
        location: booking.experience.location,
        description: `Experience booking for ${booking.quantity} ${booking.quantity > 1 ? 'people' : 'person'}. Total: $${booking.totalPrice}`,
        start: {
          dateTime: new Date(`${booking.slotDate}T${booking.slotTime}`).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(new Date(`${booking.slotDate}T${booking.slotTime}`).getTime() + (booking.experience.duration ? this.parseDuration(booking.experience.duration) : 2) * 60 * 60 * 1000).toISOString(),
          timeZone: 'UTC'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 }
          ]
        }
      };

      const response = await axios.post(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        event,
        {
          headers: {
            'Authorization': `Bearer ${userTokens.googleAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        eventId: response.data.id,
        eventUrl: response.data.htmlLink
      };

    } catch (error) {
      console.error('Google Calendar sync error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async getGoogleAuthUrl() {
    const scopes = ['https://www.googleapis.com/auth/calendar.events'];
    const redirectUri = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: this.googleCalendarClientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeGoogleCodeForTokens(code) {
    try {
      const redirectUri = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/auth/google/callback`;

      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.googleCalendarClientId,
        client_secret: this.googleCalendarClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      });

      return {
        success: true,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };

    } catch (error) {
      console.error('Google token exchange error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Weather API Integration
  async getWeatherForLocation(location, date) {
    try {
      // First, geocode the location to get coordinates
      const geocodeResponse = await axios.get(
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${this.openWeatherApiKey}`
      );

      if (!geocodeResponse.data || geocodeResponse.data.length === 0) {
        return { success: false, error: 'Location not found' };
      }

      const { lat, lon } = geocodeResponse.data[0];

      // Get weather forecast
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.openWeatherApiKey}&units=metric`
      );

      const targetDate = new Date(date);
      const forecast = weatherResponse.data.list.find(item => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate.toDateString() === targetDate.toDateString() &&
               Math.abs(itemDate.getHours() - targetDate.getHours()) <= 3;
      });

      if (!forecast) {
        return { success: false, error: 'Weather data not available for this date/time' };
      }

      return {
        success: true,
        weather: {
          temperature: forecast.main.temp,
          feelsLike: forecast.main.feels_like,
          humidity: forecast.main.humidity,
          description: forecast.weather[0].description,
          icon: forecast.weather[0].icon,
          windSpeed: forecast.wind.speed,
          precipitation: forecast.pop * 100, // Probability of precipitation as percentage
          visibility: forecast.visibility / 1000 // Convert to km
        }
      };

    } catch (error) {
      console.error('Weather API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Social Media Sharing
  async shareToFacebook(content, accessToken) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/me/feed`,
        {
          message: content.message,
          link: content.link
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        postId: response.data.id,
        url: `https://facebook.com/${response.data.id}`
      };

    } catch (error) {
      console.error('Facebook sharing error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async shareToTwitter(content) {
    try {
      // Twitter API v2 implementation would go here
      // For now, return a simulated response
      console.log('Twitter sharing not fully implemented - would share:', content);

      return {
        success: true,
        tweetId: 'simulated_' + Date.now(),
        url: `https://twitter.com/user/status/simulated_${Date.now()}`
      };

    } catch (error) {
      console.error('Twitter sharing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // External Review Platforms
  async getGoogleReviews(placeId) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${this.googleReviewsApiKey}`
      );

      if (response.data.status !== 'OK') {
        return { success: false, error: response.data.status };
      }

      const reviews = response.data.result.reviews || [];

      return {
        success: true,
        reviews: reviews.map(review => ({
          author: review.author_name,
          rating: review.rating,
          text: review.text,
          time: new Date(review.time * 1000),
          profilePhoto: review.profile_photo_url
        })),
        averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
        totalReviews: reviews.length
      };

    } catch (error) {
      console.error('Google Reviews API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_message || error.message
      };
    }
  }

  async searchGooglePlaces(query, location) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location.latitude},${location.longitude}&radius=5000&key=${this.googleReviewsApiKey}`
      );

      if (response.data.status !== 'OK') {
        return { success: false, error: response.data.status };
      }

      return {
        success: true,
        places: response.data.results.map(place => ({
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          rating: place.rating,
          totalRatings: place.user_ratings_total,
          location: place.geometry.location,
          types: place.types
        }))
      };

    } catch (error) {
      console.error('Google Places search error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_message || error.message
      };
    }
  }

  async getYelpReviews(businessId) {
    try {
      const response = await axios.get(
        `https://api.yelp.com/v3/businesses/${businessId}/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${this.yelpApiKey}`
          }
        }
      );

      return {
        success: true,
        reviews: response.data.reviews.map(review => ({
          author: review.user.name,
          rating: review.rating,
          text: review.text,
          time: new Date(review.time_created),
          profilePhoto: review.user.image_url
        })),
        totalReviews: response.data.total
      };

    } catch (error) {
      console.error('Yelp Reviews API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  async searchYelpBusinesses(term, location) {
    try {
      const response = await axios.get(
        `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(term)}&location=${encodeURIComponent(location)}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${this.yelpApiKey}`
          }
        }
      );

      return {
        success: true,
        businesses: response.data.businesses.map(business => ({
          id: business.id,
          name: business.name,
          address: business.location.display_address.join(', '),
          rating: business.rating,
          reviewCount: business.review_count,
          categories: business.categories.map(c => c.title),
          imageUrl: business.image_url,
          url: business.url
        }))
      };

    } catch (error) {
      console.error('Yelp search error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Utility functions
  parseDuration(durationString) {
    // Parse duration strings like "2 hours", "Half day", "Full day"
    const lower = durationString.toLowerCase();

    if (lower.includes('half day')) return 4;
    if (lower.includes('full day')) return 8;

    const hourMatch = lower.match(/(\d+)\s*hours?/);
    if (hourMatch) return parseInt(hourMatch[1]);

    return 2; // Default 2 hours
  }

  // Generate sharing content
  generateSharingContent(experience, booking = null) {
    const baseUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const experienceUrl = `${baseUrl}/experience/${experience._id}`;

    const content = {
      title: experience.title,
      description: experience.description?.substring(0, 200) + '...',
      url: experienceUrl,
      image: experience.images?.[0]
    };

    if (booking) {
      content.message = `I just booked "${experience.title}" on BookIt! ${experienceUrl}`;
    } else {
      content.message = `Check out this amazing experience: "${experience.title}" on BookIt! ${experienceUrl}`;
    }

    return content;
  }
}

module.exports = new ThirdPartyIntegrations();