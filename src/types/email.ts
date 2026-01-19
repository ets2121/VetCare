export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
  }
  
  export interface NotificationData {
    appointment_id: string | null | undefined;
    brand_id?: string | null | undefined;
    brand_name?: string | null | undefined;
    branch_id?: string | null | undefined;
    pet_name: string | null | undefined;
    owner_name: string | null | undefined;
    owner_email: string | null | undefined;
    service_name: string | null | undefined;
    start_time: string | null | undefined; // ISO string
    branch_name: string | null | undefined;
    branch_address: string | null | undefined;
    custom_message?: string;
    currency?: string;
  }