const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Experience = require('../models/Experience');
const Promo = require('../models/Promo');

async function seed() {
  try {
    await connectDB();
    await Experience.deleteMany({});
    await Promo.deleteMany({});

    const experiences = [
      {
        title: "Sunset Kayak",
        description: "Paddle through calm waters while the sky turns gold.",
        price: 800,
        location: "Riverbank",
        images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format&fit=crop"],
        category: "Adventure",
        rating: 4.8,
        duration: "2 hours",
        spots: 8,
        slots: [
          { date: "2025-11-10", time: "17:00", capacity: 8, bookedCount: 0 },
          { date: "2025-11-11", time: "17:00", capacity: 8, bookedCount: 0 }
        ]
      },
      {
        title: "City Food Walk",
        description: "Taste the city's best street food with a local guide.",
        price: 1200,
        location: "Downtown",
        images: ["https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=1200&q=80&auto=format&fit=crop"],
        category: "Culinary",
        rating: 4.9,
        duration: "3 hours",
        spots: 12,
        slots: [
          { date: "2025-11-12", time: "11:00", capacity: 12, bookedCount: 0 },
          { date: "2025-11-13", time: "11:00", capacity: 12, bookedCount: 0 }
        ]
      },
      {
        title: "Mountain Hiking",
        description: "Explore scenic trails with breathtaking views.",
        price: 1500,
        location: "Mountain Base",
        images: ["https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80&auto=format&fit=crop"],
        category: "Adventure",
        rating: 4.7,
        duration: "4 hours",
        spots: 10,
        slots: [
          { date: "2025-11-14", time: "08:00", capacity: 10, bookedCount: 0 },
          { date: "2025-11-15", time: "08:00", capacity: 10, bookedCount: 0 }
        ]
      },
      {
        title: "Art Gallery Tour",
        description: "Discover contemporary art in a private gallery tour.",
        price: 900,
        location: "Arts District",
        images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80&auto=format&fit=crop"],
        category: "Art",
        rating: 4.6,
        duration: "2.5 hours",
        spots: 15,
        slots: [
          { date: "2025-11-16", time: "14:00", capacity: 15, bookedCount: 0 },
          { date: "2025-11-17", time: "14:00", capacity: 15, bookedCount: 0 }
        ]
      },
      {
        title: "Yoga in the Park",
        description: "Relax and rejuvenate with outdoor yoga session.",
        price: 600,
        location: "Central Park",
        images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80&auto=format&fit=crop"],
        category: "Wellness",
        rating: 4.8,
        duration: "1.5 hours",
        spots: 20,
        slots: [
          { date: "2025-11-18", time: "07:00", capacity: 20, bookedCount: 0 },
          { date: "2025-11-19", time: "07:00", capacity: 20, bookedCount: 0 }
        ]
      },
      {
        title: "Photography Workshop",
        description: "Learn photography basics from professional photographers.",
        price: 1800,
        location: "Studio",
        images: ["https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&q=80&auto=format&fit=crop"],
        category: "Art",
        rating: 4.9,
        duration: "3 hours",
        spots: 8,
        slots: [
          { date: "2025-11-20", time: "10:00", capacity: 8, bookedCount: 0 },
          { date: "2025-11-21", time: "10:00", capacity: 8, bookedCount: 0 }
        ]
      },
      {
        title: "Wine Tasting",
        description: "Sample local wines with expert guidance.",
        price: 2200,
        location: "Vineyard",
        images: ["https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80&auto=format&fit=crop"],
        category: "Culinary",
        rating: 4.7,
        duration: "2 hours",
        spots: 12,
        slots: [
          { date: "2025-11-22", time: "16:00", capacity: 12, bookedCount: 0 },
          { date: "2025-11-23", time: "16:00", capacity: 12, bookedCount: 0 }
        ]
      },
      {
        title: "Coding Bootcamp",
        description: "Intensive coding session for beginners.",
        price: 2500,
        location: "Tech Hub",
        images: ["https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80&auto=format&fit=crop"],
        category: "Tech",
        rating: 4.5,
        duration: "6 hours",
        spots: 15,
        slots: [
          { date: "2025-11-24", time: "09:00", capacity: 15, bookedCount: 0 },
          { date: "2025-11-25", time: "09:00", capacity: 15, bookedCount: 0 }
        ]
      }
    ];

    await Experience.insertMany(experiences);

    const promos = [
      { code: 'SAVE10', type: 'percentage', value: 10, active: true },
      { code: 'FLAT100', type: 'flat', value: 100, active: true }
    ];
    await Promo.insertMany(promos);

    console.log('Seeding completed');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
