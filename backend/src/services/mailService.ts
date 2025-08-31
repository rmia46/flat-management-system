// backend/src/services/mailService.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables if not in production
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production') {
  dotenv.config();
}
// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10), // Default to 587 if not set
  secure: process.env.EMAIL_SECURE === 'true', // Use 'true' for 465, 'false' for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email with the given options.
 * @param to - Recipient email address.
 * @param subject - Subject of the email.
 * @param text - Plain text body of the email.
 * @param html - HTML body of the email (optional).
 */
export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM, // Sender address
      to, // List of receivers
      subject, // Subject line
      text, // Plain text body
      html, // HTML body (optional)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Only for ethereal.email test accounts
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email.');
  }
};

/**
 * Generates a random 6-digit numeric verification code.
 * @returns A 6-digit string.
 */
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


