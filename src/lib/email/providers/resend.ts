import { Resend } from 'resend';
import { EmailPayload } from '@/types/email';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { to, subject, html, from, replyTo } = payload;

  try {
    await resend.emails.send({
      from: from || process.env.EMAIL_FROM!,
      to,
      subject,
      html,
      reply_to: replyTo || process.env.EMAIL_REPLY_TO,
    });
  } catch (error) {
    console.error('Resend email error:', error);
    throw new Error(`Failed to send email: ${(error as Error).message}`);
  }
}