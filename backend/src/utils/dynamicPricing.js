const Experience = require('../models/Experience');
const Booking = require('../models/Booking');

class DynamicPricingEngine {
  constructor() {
    this.basePriceMultipliers = {
      // Demand-based multipliers
      highDemand: 1.3,
      mediumDemand: 1.15,
      lowDemand: 0.9,

      // Time-based multipliers
      lastMinute: 1.25,    // < 24 hours
      shortNotice: 1.1,   // 1-3 days
      earlyBird: 0.85,    // > 30 days

      // Seasonal multipliers
      peakSeason: 1.2,
      offSeason: 0.8,
      holiday: 1.4,

      // Day of week multipliers
      weekend: 1.1,
      weekday: 0.95,

      // Inventory-based multipliers
      lowInventory: 1.2,   // < 20% slots available
      highInventory: 0.9   // > 80% slots available
    };
  }

  // Calculate dynamic price for an experience slot
  async calculateDynamicPrice(experienceId, slotDate, slotTime, basePrice) {
    try {
      const experience = await Experience.findById(experienceId);
      if (!experience) return basePrice;

      let dynamicPrice = basePrice;
      const appliedMultipliers = [];

      // 1. Demand-based pricing
      const demandMultiplier = await this.calculateDemandMultiplier(experienceId, slotDate);
      dynamicPrice *= demandMultiplier;
      appliedMultipliers.push({ factor: 'demand', multiplier: demandMultiplier });

      // 2. Time-based pricing
      const timeMultiplier = this.calculateTimeMultiplier(slotDate);
      dynamicPrice *= timeMultiplier;
      appliedMultipliers.push({ factor: 'time', multiplier: timeMultiplier });

      // 3. Seasonal pricing
      const seasonalMultiplier = this.calculateSeasonalMultiplier(slotDate);
      dynamicPrice *= seasonalMultiplier;
      appliedMultipliers.push({ factor: 'seasonal', multiplier: seasonalMultiplier });

      // 4. Day of week pricing
      const dayMultiplier = this.calculateDayMultiplier(slotDate);
      dynamicPrice *= dayMultiplier;
      appliedMultipliers.push({ factor: 'dayOfWeek', multiplier: dayMultiplier });

      // 5. Inventory-based pricing
      const inventoryMultiplier = await this.calculateInventoryMultiplier(experienceId, slotDate, slotTime);
      dynamicPrice *= inventoryMultiplier;
      appliedMultipliers.push({ factor: 'inventory', multiplier: inventoryMultiplier });

      // 6. Competitor analysis (simplified)
      const competitorMultiplier = await this.calculateCompetitorMultiplier(experience.category, basePrice);
      dynamicPrice *= competitorMultiplier;
      appliedMultipliers.push({ factor: 'competitor', multiplier: competitorMultiplier });

      // Round to nearest dollar and ensure minimum price
      const finalPrice = Math.max(Math.round(dynamicPrice), Math.round(basePrice * 0.7));

      return {
        originalPrice: basePrice,
        dynamicPrice: finalPrice,
        appliedMultipliers,
        priceChange: ((finalPrice - basePrice) / basePrice * 100).toFixed(1)
      };

    } catch (error) {
      console.error('Error calculating dynamic price:', error);
      return {
        originalPrice: basePrice,
        dynamicPrice: basePrice,
        appliedMultipliers: [],
        priceChange: 0
      };
    }
  }

  // Calculate demand multiplier based on booking rates
  async calculateDemandMultiplier(experienceId, slotDate) {
    try {
      const slotDateObj = new Date(slotDate);

      // Get bookings for the same experience in the past month
      const oneMonthAgo = new Date(slotDateObj);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const recentBookings = await Booking.countDocuments({
        experience: experienceId,
        createdAt: { $gte: oneMonthAgo },
        status: { $in: ['confirmed', 'completed'] }
      });

      // Get total available slots for this experience type
      const experience = await Experience.findById(experienceId);
      const totalSlots = experience.slots.reduce((sum, slot) => sum + slot.capacity, 0);

      // Calculate booking rate
      const bookingRate = recentBookings / (totalSlots * 4); // Assuming 4 weeks in a month

      if (bookingRate > 0.8) return this.basePriceMultipliers.highDemand;
      if (bookingRate > 0.5) return this.basePriceMultipliers.mediumDemand;
      if (bookingRate < 0.2) return this.basePriceMultipliers.lowDemand;

      return 1.0;

    } catch (error) {
      console.error('Error calculating demand multiplier:', error);
      return 1.0;
    }
  }

  // Calculate time-based multiplier
  calculateTimeMultiplier(slotDate) {
    const slotDateObj = new Date(slotDate);
    const now = new Date();
    const daysDifference = Math.ceil((slotDateObj - now) / (1000 * 60 * 60 * 24));

    if (daysDifference < 1) return this.basePriceMultipliers.lastMinute;
    if (daysDifference <= 3) return this.basePriceMultipliers.shortNotice;
    if (daysDifference > 30) return this.basePriceMultipliers.earlyBird;

    return 1.0;
  }

  // Calculate seasonal multiplier
  calculateSeasonalMultiplier(slotDate) {
    const date = new Date(slotDate);
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed

    // Define peak seasons (summer, winter holidays)
    const peakMonths = [6, 7, 8, 12, 1]; // June-August, December-January
    const holidayMonths = [11, 12]; // November-December (Thanksgiving, Christmas)

    if (holidayMonths.includes(month)) return this.basePriceMultipliers.holiday;
    if (peakMonths.includes(month)) return this.basePriceMultipliers.peakSeason;

    // Off-season months
    const offSeasonMonths = [2, 3, 4]; // February-April
    if (offSeasonMonths.includes(month)) return this.basePriceMultipliers.offSeason;

    return 1.0;
  }

  // Calculate day of week multiplier
  calculateDayMultiplier(slotDate) {
    const date = new Date(slotDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Weekend pricing
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return this.basePriceMultipliers.weekend;
    }

    return this.basePriceMultipliers.weekday;
  }

  // Calculate inventory-based multiplier
  async calculateInventoryMultiplier(experienceId, slotDate, slotTime) {
    try {
      const experience = await Experience.findById(experienceId);
      if (!experience) return 1.0;

      const slot = experience.slots.find(s => s.date === slotDate && s.time === slotTime);
      if (!slot) return 1.0;

      const availableSlots = slot.capacity - (slot.bookedCount || 0);
      const availabilityRate = availableSlots / slot.capacity;

      if (availabilityRate < 0.2) return this.basePriceMultipliers.lowInventory;
      if (availabilityRate > 0.8) return this.basePriceMultipliers.highInventory;

      return 1.0;

    } catch (error) {
      console.error('Error calculating inventory multiplier:', error);
      return 1.0;
    }
  }

  // Calculate competitor-based multiplier (simplified)
  async calculateCompetitorMultiplier(category, basePrice) {
    try {
      // Get average price for similar experiences
      const similarExperiences = await Experience.find({
        category: category,
        isActive: true,
        price: { $exists: true }
      });

      if (similarExperiences.length === 0) return 1.0;

      const avgCompetitorPrice = similarExperiences.reduce((sum, exp) => sum + exp.price, 0) / similarExperiences.length;

      // Adjust price to be competitive
      const priceRatio = basePrice / avgCompetitorPrice;

      if (priceRatio < 0.8) return 1.1; // Price lower than competitors, can increase
      if (priceRatio > 1.2) return 0.9; // Price higher than competitors, should decrease

      return 1.0;

    } catch (error) {
      console.error('Error calculating competitor multiplier:', error);
      return 1.0;
    }
  }

  // Get pricing rules for admin interface
  getPricingRules() {
    return {
      demandBased: {
        highDemand: '30% increase when booking rate > 80%',
        mediumDemand: '15% increase when booking rate > 50%',
        lowDemand: '10% decrease when booking rate < 20%'
      },
      timeBased: {
        lastMinute: '25% increase for bookings < 24 hours away',
        shortNotice: '10% increase for bookings 1-3 days away',
        earlyBird: '15% decrease for bookings > 30 days away'
      },
      seasonal: {
        peakSeason: '20% increase during peak months',
        offSeason: '20% decrease during off-peak months',
        holiday: '40% increase during holidays'
      },
      dayOfWeek: {
        weekend: '10% increase on weekends',
        weekday: '5% decrease on weekdays'
      },
      inventory: {
        lowInventory: '20% increase when < 20% slots available',
        highInventory: '10% decrease when > 80% slots available'
      },
      competitor: {
        adjustment: 'Adjust based on category average pricing'
      }
    };
  }

  // Apply bulk pricing updates
  async applyBulkPricingUpdates() {
    try {
      console.log('Applying bulk dynamic pricing updates...');

      const experiences = await Experience.find({ isActive: true });
      let updatedCount = 0;

      for (const experience of experiences) {
        for (const slot of experience.slots) {
          const pricing = await this.calculateDynamicPrice(
            experience._id,
            slot.date,
            slot.time,
            experience.price
          );

          // Store dynamic price in slot (you might want to add a dynamicPrice field to SlotSchema)
          slot.dynamicPrice = pricing.dynamicPrice;
          slot.pricingFactors = pricing.appliedMultipliers;
        }

        await experience.save();
        updatedCount++;
      }

      console.log(`Updated pricing for ${updatedCount} experiences`);
      return { success: true, updatedCount };

    } catch (error) {
      console.error('Error applying bulk pricing updates:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new DynamicPricingEngine();