/**
 * Enums from `users` table CHECK constraints.
 */

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    STAFF = 'STAFF',
    CUSTOMER = 'CUSTOMER'
  }
  
  export enum UserStatus {
    ACTIVE = 'active',
    // DB DEFAULT 'active'; inferred
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended'
  } 