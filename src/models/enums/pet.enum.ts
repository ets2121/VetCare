/**
 * Enums from `pets` table CHECK constraints.
 */

export enum PetSex {
    MALE = 'male',
    FEMALE = 'female',
    UNKNOWN = 'unknown'
  }
  
  export enum PetStatus {
    ACTIVE = 'active',
    // DB DEFAULT 'active'; inferred common states
    INACTIVE = 'inactive',
    DECEASED = 'deceased'
  }