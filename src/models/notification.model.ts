// models/notification.model.ts

export type NotificationType =
  | 'APPOINTMENT'
  | 'CUSTOMER_REQUEST'
  | 'SYSTEM_ALERT'
  | 'PASSPORT'
  | 'GENERAL';

export interface Notification {
  notification_id: string;
  // PRIMARY KEY

  brand_id: string | null;
  // FOREIGN KEY → brands.brand_id

  branch_id: string | null;
  // FOREIGN KEY → branches.branch_id

  user_id: string | null;
  // FOREIGN KEY → users.user_id
  // Receiver

  sender_id: string | null;
  // FOREIGN KEY → users.user_id
  // Sender

  notification_type: NotificationType | null;
  // Enum constraint

  category: string | null;
  // Optional category

  title: string | null;
  // Notification title

  message: string | null;
  // Notification body

  link_url: string | null;
  // Optional redirect URL

  is_read: boolean;
  // Default: false

  priority: string;
  // Default: NORMAL

  visible_to_customer: boolean;
  // Visibility flag

  visible_to_admin: boolean;
  // Visibility flag

  status: string;
  // Default: ACTIVE

  created_at: string;
  // Timestamp

  read_at: string | null;
  // Timestamp when read
}
