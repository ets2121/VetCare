// models/brand.model.ts

export interface Brand {
    brand_id: string;
    // PRIMARY KEY
    // UUID
  
    name: string;
    // Required
    // Brand / company name
  
    logo_url: string | null;
    // Optional
    // URL of brand logo
  
    email: string | null;
    // Optional
    // Brand contact email
  
    phone: string | null;
    // Optional
    // Brand contact phone
  
    status: string;
    // Default: 'active'
    // Used to disable brand access
  
    created_at: string;
    // Timestamp
  
    updated_at: string;
    // Timestamp
  }
  