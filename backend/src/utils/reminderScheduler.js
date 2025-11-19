const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendReminderEmail } = require('./emailService');

// Function to get tomorrow's date in YYYY-MM-DD format
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Function to send reminder emails for tomorrow's bookings
const sendReminderEmails = async () => {
  try {
    const tomorrowDate = getTomorrowDate();
    console.log(`Checking for bookings on ${tomorrowDate} to send reminders...`);

    // Find all confirmed bookings for tomorrow
    const bookings = await Booking.find({
      slotDate: tomorrowDate,
      status: 'confirmed'
    }).populate('experience');

    console.log(`Found ${bookings.length} bookings for tomorrow`);

    for (const booking of bookings) {
      try {
        const bookingData = {
          userName: booking.userName,
          userEmail: booking.userEmail,
          experienceTitle: booking.experience.title,
          slotDate: booking.slotDate,
          slotTime: booking.slotTime,
          quantity: booking.quantity,
          quantityLabel: booking.quantity > 1 ? 'people' : 'person',
          bookingId: booking._id.toString(),
          experienceLocation: booking.experience.location || 'Location TBA'
        };

        await sendReminderEmail(bookingData);
        console.log(`Reminder email sent for booking ${booking._id}`);
      } catch (emailError) {
        console.error(`Failed to send reminder for booking ${booking._id}:`, emailError);
      }
    }
  } catch (error) {
    console.error('Error in reminder email scheduler:', error);
  }
};

// Schedule the reminder emails to run daily at 9 AM
const startReminderScheduler = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('Running daily reminder email scheduler...');
    sendReminderEmails();
  }, {
    timezone: "America/New_York" // Adjust timezone as needed
  });

  console.log('Reminder email scheduler started - will run daily at 9 AM');
};

// For testing purposes, you can also export the function to run manually
module.exports = {
  startReminderScheduler,
  sendReminderEmails
};