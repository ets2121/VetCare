export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
  }
  
  export interface NotificationData {
    appointment_id: string;
    pet_name: string;
    owner_name: string;
    owner_email: string;
    service_name: string;
    start_time: string; // ISO string
    branch_name: string;
    branch_address: string;
    custom_message?: string;
    currency?: string;
  }