// src/email/email.service.js
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');

// Require the helpers file to register them globally
// This must be a separate file like 'src/email/helpers.js'
// that contains all handlebars.registerHelper calls.
require('./helpers');

class EmailService {
    static transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVICE_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    static async sendVerificationEmail(email, name, code, expiresAt) {
        const templatePath = path.join(__dirname, './templates/verification-email.hbs');
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateSource);

        const html = template({
            name,
            code,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
            expirationTime: expiresAt.toLocaleString(),
            appName: process.env.APP_NAME || 'Our App',
        });

        await this.transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'App Team'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
            to: email,
            subject: 'Please verify your email address',
            html,
        });
    }

    static async sendPasswordResetEmail(email, name, code, expiresAt) {
        const templatePath = path.join(__dirname, './templates/password-reset-email.hbs');
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateSource);

        const html = template({
            name,
            resetCode: code,
            expirationTime: expiresAt.toLocaleString(),
            supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
            appName: process.env.APP_NAME || 'Our App',
        });

        await this.transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'App Team'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
            to: email,
            subject: 'Password Reset Code',
            html,
        });
    }

    static async sendBookingConfirmation(email, booking, outboundTrip, returnTrip, passengers) {
        const templatePath = path.join(__dirname, './templates/booking-confirmation.hbs');
        const templateSource = fs.readFileSync(templatePath, 'utf8');

        // Convert Sequelize objects to plain JSON objects
        const plainBooking = booking.get({ plain: true });
        const plainOutboundTrip = outboundTrip.get({ plain: true });
        const plainReturnTrip = returnTrip ? returnTrip.get({ plain: true }) : null;

        // Create an array of seat numbers from the passengers array
        const seatNumbers = passengers
          .filter(p => p.seat_number)
          .map(p => p.seat_number);

        const template = handlebars.compile(templateSource);

        const html = template({
            customerName: passengers.find(p => p.is_primary)?.name || 'Valued Customer',
            companyName: process.env.EMAIL_FROM_NAME || 'Your Bus Service',
            supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
            booking: plainBooking,
            outboundTrip: plainOutboundTrip,
            returnTrip: plainReturnTrip,
            passengers,
            seatNumbers, // Pass the new array to the template
        });

        await this.transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Booking Service'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
            to: email,
            subject: `Your Booking Confirmation #${booking.booking_reference}`,
            html,
        });
    }

    static async sendCompanyNotification(email, booking, outboundTrip, returnTrip, passengers) {
        const templatePath = path.join(__dirname, './templates/company-notification.hbs');
        const templateSource = fs.readFileSync(templatePath, 'utf8');

        // Create an array of seat numbers from the passengers array
        const seatNumbers = passengers
          .filter(p => p.seat_number)
          .map(p => p.seat_number);

        const template = handlebars.compile(templateSource);
        
        const html = template({
            companyName: process.env.EMAIL_FROM_NAME || 'Your Bus Service',
            booking: booking.get({ plain: true }),
            outboundTrip: outboundTrip.get({ plain: true }),
            returnTrip: returnTrip ? returnTrip.get({ plain: true }) : null,
            passengers,
            seatNumbers,
        });

        await this.transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Booking Service'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
            to: email,
            subject: `New Booking Alert: #${booking.booking_reference}`,
            html,
        });
    }
}

module.exports = EmailService;