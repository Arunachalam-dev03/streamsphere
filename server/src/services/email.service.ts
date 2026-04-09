import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static async getTransporter() {
    if (this.transporter) return this.transporter;

    // Use Ethereal Email for testing if no environment variables are set
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Create a test account automatically
      const testAccount = await nodemailer.createTestAccount();
      console.log('Created Ethereal Test Account:', testAccount.user);

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
    }

    return this.transporter;
  }

  static async sendPasswordResetEmail(to: string, resetUrl: string) {
    const transporter = await this.getTransporter();

    const mailOptions = {
      from: '"StreamSphere No-Reply" <noreply@streamsphere.local>',
      to,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #FF0000; display: flex; align-items: center;">StreamSphere</h2>
          <h3>Password Reset Request</h3>
          <p>We received a request to reset the password for your account.</p>
          <p>Click the button below to set a new password. The link will expire in 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #FF0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If you did not make this request, you can safely ignore this email.</p>
          <hr style="border: 1px solid #eee; margin-top: 30px;"/>
          <p style="font-size: 12px; color: #888; text-align: center;">© 2026 StreamSphere. All rights reserved.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('====================================');
    console.log('📧 Password Reset Email Sent!');
    console.log('📬 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    console.log('====================================');

    return info;
  }
}
