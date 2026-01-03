// models/branch.model.ts

export interface Branch {
    branch_id: string;
    // PRIMARY KEY
  
    brand_id: string | null;
    // FOREIGN KEY → brands.brand_id
  
    name: string;
    // Required
    // Branch name
  
    address: string | null;
    // Physical address
  
    phone: string | null;
    // Branch contact number
  
    status: string;
    // Default: 'active'
  
    created_at: string;
    // Timestamp
  
    updated_at: string;
    // Timestamp
  }
  