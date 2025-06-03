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

  static async sendVerificationEmail(email: string, name: string, token: string, token_expires: string ) {
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
    
    const templatePath = path.join(__dirname, './templates/verification-email.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);
    
    const html = template({
      name,
      verificationUrl,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
    });

    await this.transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'App Team'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: 'Please verify your email address',
      html
    });
  }
}

export default EmailService;