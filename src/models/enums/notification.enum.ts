/**
 * Enums from `notifications` table CHECK constraints.
 */

export enum NotificationType {
    APPOINTMENT = 'APPOINTMENT',
    CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
    SYSTEM_ALERT = 'SYSTEM_ALERT',
    PASSPORT = 'PASSPORT',
    GENERAL = 'GENERAL'
  }
  
  export enum NotificationPriority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
    // DB DEFAULT 'NORMAL'
  }
  
  export enum NotificationStatus {
    ACTIVE = 'ACTIVE',
    // DB DEFAULT 'ACTIVE'; no strict CHECK — extend as needed
    DISMISSED = 'DISMISSED',
    ARCHIVED = 'ARCHIVED'
  }