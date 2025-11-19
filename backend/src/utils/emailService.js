const sgMail = require('@sendgrid/mail');
const path = require('path');
const fs = require('fs');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@bookit.com';

// Load email templates
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
  return fs.readFileSync(templatePath, 'utf8');
};

// Replace placeholders in template
const renderTemplate = (template, data) => {
  let rendered = template;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, data[key]);
  });
  return rendered;
};

// Send booking confirmation email
const sendBookingConfirmation = async (bookingData) => {
  try {
    const template = loadTemplate('booking-confirmation');
    const html = renderTemplate(template, bookingData);

    const msg = {
      to: bookingData.userEmail,
      from: EMAIL_FROM,
      subject: `Booking Confirmed: ${bookingData.experienceTitle}`,
      html: html,
    };

    await sgMail.send(msg);
    console.log('Booking confirmation email sent to:', bookingData.userEmail);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

// Send reminder email
const sendReminderEmail = async (bookingData) => {
  try {
    const template = loadTemplate('booking-reminder');
    const html = renderTemplate(template, bookingData);

    const msg = {
      to: bookingData.userEmail,
      from: EMAIL_FROM,
      subject: `Reminder: ${bookingData.experienceTitle} Tomorrow`,
      html: html,
    };

    await sgMail.send(msg);
    console.log('Reminder email sent to:', bookingData.userEmail);
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
};

// Send cancellation email
const sendCancellationEmail = async (bookingData) => {
  try {
    const template = loadTemplate('booking-cancellation');
    const html = renderTemplate(template, bookingData);

    const msg = {
      to: bookingData.userEmail,
      from: EMAIL_FROM,
      subject: `Booking Cancelled: ${bookingData.experienceTitle}`,
      html: html,
    };

    await sgMail.send(msg);
    console.log('Cancellation email sent to:', bookingData.userEmail);
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendReminderEmail,
  sendCancellationEmail,
};