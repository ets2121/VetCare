import { sendEmail } from './providers/resend';
import { EmailPayload } from '@/types/email';

export class EmailService {
  private static instance: EmailService;
  private isConfigured: boolean;

  private constructor() {
    this.isConfigured = !!process.env.EMAIL_PROVIDER;
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async send(payload: EmailPayload): Promise<void> {
    if (!this.isConfigured) {
      console.warn('Email not configured. Skipping email send.');
      return;
    }

    if (process.env.EMAIL_PROVIDER === 'RESEND') {
      await sendEmail(payload);
    } else {
      throw new Error(`Unsupported email provider: ${process.env.EMAIL_PROVIDER}`);
    }
  }
}