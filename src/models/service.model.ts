// models/service.model.ts

export interface Service {
    service_id: string;
    // PRIMARY KEY
  
    brand_id: string | null;
    // FOREIGN KEY → brands.brand_id
  
    name: string;
    // Required
    // Service name
  
    description: string | null;
    // Service description
  
    duration_minutes: number;
    // Default: 30
    // Service duration
  
    price: number;
    // Default: 0
  
    active: boolean;
    // Default: true
    // Used to enable / disable service
  
    created_at: string;
    // Timestamp
  
    updated_at: string;
    // Timestamp
  }
  