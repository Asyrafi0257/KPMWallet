import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendRegistrationCode(email: string, code: string) {
    const { data, error } = await this.resend.emails.send({
      from: 'KPMWallet <onboarding@resend.dev>',
      to: email,
      subject: 'KPMWallet Registration Code',
      html: `
        <h2>KPMWallet</h2>

        <p>Your registration code is:</p>

        <h1>${code}</h1>

        <p>Please keep this code for your registration.</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    console.log('Email sent:', data);

    return data;
  }


async sendPasswordResetOtp(email: string, otp: string) {
  const { data, error } = await this.resend.emails.send({
    from: 'KPMWallet <onboarding@resend.dev>',
    to: email,
    subject: 'KPMWallet - Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>KPMWallet</h2>

        <p>You requested to reset your password.</p>

        <p>Your OTP verification code is:</p>

        <h1 style="
          letter-spacing: 8px;
          color: #4F46E5;
          font-size: 32px;
        ">${otp}</h1>

        <p>This OTP will expire in 5 minutes.</p>

        <p>
          If you did not request a password reset,
          please ignore this email.
        </p>

        <p>Thank you,<br />KPMWallet Team</p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send password reset OTP');
  }

  console.log('Password reset OTP email sent:', data);

  return data;
}


}