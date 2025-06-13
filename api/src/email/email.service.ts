// src/services/email.service.ts
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';

class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVICE_HOST!,
    port: parseInt(process.env.EMAIL_PORT!),
    auth: {
      user: process.env.EMAIL_USERNAME!,
      pass: process.env.EMAIL_PASSWORD!
    }
  });

  static async sendVerificationEmail(email: string, name: string, token: string, expiresAt: Date ) {
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
    
    const templatePath = path.join(__dirname, './templates/verification-email.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);
    
    const html = template({
      name,
      verificationUrl,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
       expirationTime: expiresAt.toLocaleString(),
    });

    await this.transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'App Team'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: 'Please verify your email address',
      html
    });
  }

  // src/email/email.service.ts
static async sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
  expiresAt: Date
) {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  
  const templatePath = path.join(__dirname, './templates/password-reset-email.hbs');
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateSource);
  
  const html = template({
    name,
    resetUrl,
    expirationTime: expiresAt.toLocaleString(),
    supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
  });

  await this.transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'App Team'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: 'Password Reset Request',
    html
  });
}

static async sendBookingConfirmation(
    email: string,
    name: string,
    bookingDetails: {
      reference: string;
      seats: number[];
      total_amount: number;
      trip: {
        departure_location: string;
        arrival_location: string;
        departure_time: Date;
        estimated_arrival: Date;
      };
      bus: {
        brand: string;
        plate_number: string;
      };
    }
  ) {
    const templatePath = path.join(__dirname, './templates/booking-confirmation.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    
    // Register Handlebars helpers
    handlebars.registerHelper('formatTime', (date: Date) => {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    });

    handlebars.registerHelper('join', (array: any[]) => {
      return array.join(', ');
    });

    const template = handlebars.compile(templateSource);
    
    const html = template({
      name,
      companyName: process.env.COMPANY_NAME || 'Our Bus Service',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
      booking: bookingDetails,
      trip: bookingDetails.trip,
      bus: bookingDetails.bus
    });

    await this.transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Booking Service'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Your Booking Confirmation #${bookingDetails.reference}`,
      html
    });
  }

}

export default EmailService;