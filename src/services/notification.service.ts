import { createClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/email/email-service';
import { renderConfirmationEmail, renderCancellationEmail } from '@/emails';
import { NotificationData } from '@/types/email';
import { NotificationType, NotificationPriority } from '@/models';

export interface CreateNotificationInput {
  user_id: string;
  sender_id?: string | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  link_url?: string;
  visible_to_customer: boolean;
  visible_to_admin: boolean;
  priority?: NotificationPriority;
  branch_id?: string | null;
  shouldEmail?: boolean;
  emailData?: NotificationData;
}

export class NotificationService {
  private supabase = createClient();
  private brand_id: string;
  private emailService: EmailService;

  constructor(brand_id: string) {
    this.brand_id = brand_id;
    this.emailService = EmailService.getInstance();
  }

  async create(input: CreateNotificationInput): Promise<void> {
    const {
      user_id,
      sender_id,
      notification_type,
      title,
      message,
      link_url,
      visible_to_customer,
      visible_to_admin,
      priority = NotificationPriority.NORMAL,
      branch_id,
      shouldEmail = false,
      emailData,
    } = input;

    // Create system notification
    const { error: dbError } = await this.supabase
      .from('notifications')
      .insert({
        brand_id: this.brand_id,
        branch_id: branch_id || null,
        user_id,
        sender_id,
        notification_type,
        category: 'APPOINTMENT',
        title,
        message,
        link_url,
        is_read: false,
        priority,
        visible_to_customer,
        visible_to_admin,
        status: 'ACTIVE',
      });

    if (dbError) {
      console.error('Failed to create system notification:', dbError);
    }

    // Send email if requested and enabled
    if (shouldEmail && emailData) {
      try {
        let html = '';
        let subject = '';

        switch (notification_type) {
          case NotificationType.APPOINTMENT:
            if (title.includes('Confirmed')) {
              html = await renderConfirmationEmail(emailData);
              subject = 'Your Appointment is Confirmed!';
            } else if (title.includes('Cancelled')) {
              const cancelledBy = title.includes('by Customer') ? 'customer' : 'staff';
              html = await renderCancellationEmail(emailData, cancelledBy);
              subject = 'Your Appointment has been Cancelled';
            }
            break;
          default:
            return; // Don't send email for non-appointment notifications
        }

        if (html && subject) {
          await this.emailService.send({
            to: emailData.owner_email,
            subject,
            html,
            replyTo: emailData.custom_message ? undefined : emailData.owner_email,
          });
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    }
  }
}