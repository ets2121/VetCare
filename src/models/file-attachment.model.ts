// models/fileAttachment.model.ts

export interface FileAttachment {
    file_id: string;
    // PRIMARY KEY
  
    entry_id: string | null;
    // FOREIGN KEY → pet_passport_entries.entry_id
  
    brand_id: string | null;
    // FOREIGN KEY → brands.brand_id
  
    file_url: string | null;
    // URL of uploaded file
  
    file_type: string | null;
    // e.g. image/pdf
  
    uploaded_by: string | null;
    // FOREIGN KEY → users.user_id
  
    uploaded_at: string;
    // Timestamp
  }
  