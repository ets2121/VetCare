/**
 * Shared base interfaces for all models.
 * Reflects common columns in your Supabase schema.
 */

export interface Timestamps {
    created_at?: string | null;
    updated_at?: string | null;
  }
  
  export interface Identifiable {
    id: string; // Generic — actual column name (e.g., user_id) used in concrete models
  }