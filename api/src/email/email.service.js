// src/email.service.js
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');

// Get current directory path for ES modules

class EmailService {
  static transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVICE_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  static async sendVerificationEmail(email, name, token, code, expiresAt) {
    const webVerificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
    const mobileVerificationCode = code;
    
    const templatePath = path.join(__dirname, './templates/verification-email.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const html = template({
      name,
      webVerificationUrl,
      mobileVerificationCode,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
      expirationTime: expiresAt.toLocaleString(),
      appName: process.env.APP_NAME || 'Our App'
    });

    await this.transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'App Team'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: 'Please verify your email address',
      html,
    });
  }

  // src/email/email.service.ts
  static async sendPasswordResetEmail(email, name, token, expiresAt) {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

    const templatePath = path.join(__dirname, './templates/password-reset-email.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const html = template({
      name,
      resetUrl,
      expirationTime: expiresAt.toLocaleString(),
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    });

    await this.transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'App Team'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: 'Password Reset Request',
      html,
    });
  }

  static async sendBookingConfirmation(email, name, bookingDetails) {
    const templatePath = path.join(__dirname, './templates/booking-confirmation.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');

    // Register Handlebars helpers
    handlebars.registerHelper('formatTime', date => {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    handlebars.registerHelper('formatCurrency', amount => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    });

    handlebars.registerHelper('join', array => {
      return array.join(', ');
    });

    const template = handlebars.compile(templateSource);

    const html = template({
      name,
      companyName: process.env.COMPANY_NAME || 'Our Bus Service',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
      booking: bookingDetails,
      trip: bookingDetails.trip,
      bus: bookingDetails.bus,
    });

    await this.transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Booking Service'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Your Booking Confirmation #${bookingDetails.reference}`,
      html,
    });
  }
}

module.exports = EmailService;
