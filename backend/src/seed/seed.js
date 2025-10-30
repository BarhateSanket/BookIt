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
        slots: [
          { date: "2025-11-12", time: "11:00", capacity: 12, bookedCount: 0 },
          { date: "2025-11-13", time: "11:00", capacity: 12, bookedCount: 0 }
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
