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
}