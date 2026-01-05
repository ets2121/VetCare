/**
 * Enums derived from CHECK constraints in `appointments` table.
 */

export enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED'
  }
  
  export enum PaymentStatus {
    UNPAID = 'UNPAID',
    // Note: DB uses DEFAULT 'UNPAID', but no strict enum — we extend with common values
    PAID = 'PAID',
    PARTIAL = 'PARTIAL',
    REFUNDED = 'REFUNDED'
  }