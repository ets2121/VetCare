import { createClient } from '@/lib/supabase/server';
import {
  Appointment,
  AppointmentCreateInput,
  AppointmentUpdateInput,
  AppointmentStatus,
  PaymentStatus,
  UserRole,
} from '@/models';
import {
  toUtc,
  isWeekend,
  addDays,
  formatDate,
  formatManilaDateTime,
} from '@/lib/time-helpers';
import { SettingsService, BranchSettings } from './settings.service';
import { NotificationService } from './notification.service';
import { NotificationData } from '@/types/email';

export interface AppointmentWithRelations extends Appointment {
  pet_name: string;
  owner_name: string;
  owner_email: string;
  service_name: string;
  branch_name: string;
  branch_address: string;
  staff_name: string;
}

export interface AvailableDate {
  date: string;
  day_of_week: string;
  slots_available: number;
  is_today: boolean;
  is_holiday: boolean;
  is_full: boolean;
}

export interface AvailableSlot {
  time: string;
  start_time: string; // ISO string in UTC
}

export class AppointmentService {
  private supabase = createClient();
  private brand_id: string;
  private user_id: string;
  private role: string;
  private branch_id?: string;
  private notificationService: NotificationService;
  private settingsService: SettingsService;

  constructor(
    brand_id: string,
    user_id: string,
    role: string,
    branch_id?: string
  ) {
    this.brand_id = brand_id;
    this.user_id = user_id;
    this.role = role;
    this.branch_id = branch_id;
    this.notificationService = new NotificationService(brand_id);
    this.settingsService = new SettingsService();
  }

  /**
   * Get available dates within booking window
   */
  async getAvailableDates(branch_id: string, service_id: string): Promise<AvailableDate[]> {
    const settings = await this.settingsService.getBranchSettings(this.brand_id, branch_id);
    
    // Validate service exists and is active
    const {  service } = await this.supabase
      .from('services')
      .select('duration_minutes')
      .eq('service_id', service_id)
      .eq('brand_id', this.brand_id)
      .single();

    if (!service) {
      throw new Error('Service not found');
    }

    const today = new Date();
    const startDate = new Date(today);
    const endDate = addDays(today, settings.booking_window_days);
    
    const dates: AvailableDate[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check same-day booking
      const isToday = dateStr === formatDate(today);
      if (isToday && !settings.allow_same_day_booking) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check holidays
      const isHoliday = this.isHoliday(dateStr, settings);
      if (isHoliday) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Count existing appointments
      const { count: appointmentCount } = await this.supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', this.brand_id)
        .eq('branch_id', branch_id)
        .gte('start_time', `${dateStr}T00:00:00Z`)
        .lt('start_time', `${addDays(currentDate, 1).toISOString().split('T')[0]}T00:00:00Z`);

      const isFull = settings.max_daily_appointments !== null && 
                    (appointmentCount || 0) >= settings.max_daily_appointments;

      dates.push({
        date: dateStr,
        day_of_week: dayOfWeek,
        slots_available: isFull ? 0 : this.calculateAvailableSlots(service.duration_minutes, settings),
        is_today: isToday,
        is_holiday: false,
        is_full,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  /**
   * Get available slots for a specific date
   */
  async getAvailableSlots(branch_id: string, service_id: string, date: string): Promise<AvailableSlot[]> {
    const settings = await this.settingsService.getBranchSettings(this.brand_id, branch_id);
    
    // Validate date
    const today = formatDate(new Date());
    if (date < today) {
      throw new Error('Cannot book past dates');
    }

    // Validate service
    const {  service } = await this.supabase
      .from('services')
      .select('duration_minutes')
      .eq('service_id', service_id)
      .eq('brand_id', this.brand_id)
      .single();

    if (!service) {
      throw new Error('Service not found');
    }

    // Check same-day booking
    if (date === today && !settings.allow_same_day_booking) {
      throw new Error('Same-day booking is not allowed');
    }

    // Check holidays
    if (this.isHoliday(date, settings)) {
      throw new Error('Selected date is a holiday');
    }

    // Generate all possible slots
    const slots = this.generateSlotsForDay(settings, service.duration_minutes);
    const availableSlots: AvailableSlot[] = [];

    // Get booked slots
    const startDate = new Date(`${date}T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const {  bookedAppointments } = await this.supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('brand_id', this.brand_id)
      .eq('branch_id', branch_id)
      .gte('start_time', startDate.toISOString())
      .lt('start_time', endDate.toISOString());

    // Filter available slots
    for (const slot of slots) {
      const slotStart = new Date(`${date}T${slot}:00${settings.timezone_offset}`);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + service.duration_minutes);

      // Check overlap with booked appointments
      const isBooked = bookedAppointments.some(app => {
        const appStart = new Date(app.start_time);
        const appEnd = new Date(app.end_time);
        return slotStart < appEnd && appStart < slotEnd;
      });

      // Check daily quota
      const { count: currentBookings } = await this.supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', this.brand_id)
        .eq('branch_id', branch_id)
        .gte('start_time', `${date}T00:00:00Z`)
        .lt('start_time', `${addDays(new Date(date), 1).toISOString().split('T')[0]}T00:00:00Z`);

      const quotaExceeded = settings.max_daily_appointments !== null && 
                           (currentBookings || 0) >= settings.max_daily_appointments;

      if (!isBooked && !quotaExceeded) {
        availableSlots.push({
          time: slot,
          start_time: slotStart.toISOString(),
        });
      }
    }

    return availableSlots;
  }

  /**
   * Create a new appointment
   */
  async create(input: AppointmentCreateInput): Promise<AppointmentWithRelations> {
    const { pet_id, owner_id, service_id, start_time, notes, branch_id } = input;

    if (!branch_id) {
      throw new Error('Branch ID is required');
    }

    // Verify pet ownership (if customer)
    if (this.role === UserRole.CUSTOMER) {
      const {  pet } = await this.supabase
        .from('pets')
        .select('owner_id, name')
        .eq('pet_id', pet_id)
        .eq('brand_id', this.brand_id)
        .single();
      
      if (!pet || pet.owner_id !== this.user_id) {
        throw new Error('Pet not found or access denied');
      }
    }

    // Get settings
    const settings = await this.settingsService.getBranchSettings(this.brand_id, branch_id);

    // Validate time
    await this.validateTime(settings, branch_id, service_id, start_time);

    // Get service details
    const {  service } = await this.supabase
      .from('services')
      .select('name, duration_minutes, price')
      .eq('service_id', service_id)
      .eq('brand_id', this.brand_id)
      .single();

    if (!service) {
      throw new Error('Service not found');
    }

    // Calculate end_time
    const end_time = new Date(start_time);
    end_time.setMinutes(end_time.getMinutes() + service.duration_minutes);
    const end_time_str = end_time.toISOString();

    // Determine status
    const status = settings.auto_confirm_bookings 
      ? AppointmentStatus.CONFIRMED 
      : AppointmentStatus.PENDING;

    // Create appointment
    const insertData = {
      brand_id: this.brand_id,
      branch_id,
      pet_id,
      owner_id,
      service_id,
      start_time,
      end_time: end_time_str,
      status,
      payment_status: PaymentStatus.UNPAID,
      notes: notes || null,
      created_by: this.user_id,
    };

    const { data, error } = await this.supabase
      .from('appointments')
      .insert([insertData])
      .select(`
        appointment_id,
        brand_id,
        branch_id,
        pet_id,
        owner_id,
        service_id,
        start_time,
        end_time,
        status,
        payment_status,
        notes,
        created_by,
        created_at,
        updated_at,
        pet: pets!inner(name),
        owner: users!owner_id(full_name, email),
        service: services!inner(name),
        branch: branches!inner(name, address),
        staff: users!created_by(full_name)
      `)
      .single();

    if (error) throw error;

    const appointment = {
      ...data,
      pet_name: data.pet.name,
      owner_name: data.owner.full_name || 'Unknown',
      owner_email: data.owner.email,
      service_name: data.service.name,
      branch_name: data.branch.name,
      branch_address: data.branch.address,
      staff_name: data.staff.full_name || 'Staff',
    } as AppointmentWithRelations;

    // Auto-create passport entry if required
    if (settings.require_pet_record) {
      await this.createPassportEntryIfMissing(pet_id, branch_id);
    }

    // Prepare notification data
    const notificationData: NotificationData = {
      appointment_id: appointment.appointment_id,
      pet_name: appointment.pet_name,
      owner_name: appointment.owner_name,
      owner_email: appointment.owner_email,
      service_name: appointment.service_name,
      start_time: appointment.start_time,
      branch_name: appointment.branch_name,
      branch_address: appointment.branch_address,
      custom_message: settings.booking_confirmation_message || undefined,
      currency: settings.currency,
    };

    // Send notifications
    const isCustomerBooking = this.role === UserRole.CUSTOMER;
    if (isCustomerBooking) {
      // Notify staff
      const { data: staffUsers } = await this.supabase
        .from('users')
        .select('user_id')
        .eq('brand_id', this.brand_id)
        .eq('branch_id', branch_id)
        .in('role', ['ADMIN', 'STAFF'])
        .limit(1);

      if (staffUsers.length > 0) {
        await this.notificationService.create({
          user_id: staffUsers[0].user_id,
          notification_type: NotificationType.APPOINTMENT,
          title: 'New Appointment Request',
          message: `${appointment.owner_name} requested ${appointment.service_name} for ${appointment.pet_name}`,
          link_url: `/appointments/${appointment.appointment_id}`,
          visible_to_admin: true,
          visible_to_customer: false,
          priority: NotificationPriority.HIGH,
          branch_id,
        });
      }
    }

    // Send confirmation if auto-confirmed or staff booking
    if (status === AppointmentStatus.CONFIRMED || !isCustomerBooking) {
      await this.notificationService.create({
        user_id: owner_id,
        sender_id: this.user_id,
        notification_type: NotificationType.APPOINTMENT,
        title: 'Appointment Confirmed',
        message: `Your ${appointment.service_name} is confirmed for ${formatManilaDateTime(appointment.start_time)}`,
        link_url: `/appointments/${appointment.appointment_id}`,
        visible_to_customer: true,
        visible_to_admin: false,
        branch_id,
        shouldEmail: settings.enable_notifications && settings.enable_email_notifications,
        emailData: notificationData,
      });
    }

    return appointment;
  }

  /**
   * List appointments based on role
   */
  async list(): Promise<AppointmentWithRelations[]> {
    let query = this.supabase
      .from('appointments')
      .select(`
        appointment_id,
        brand_id,
        branch_id,
        pet_id,
        owner_id,
        service_id,
        start_time,
        end_time,
        status,
        payment_status,
        notes,
        created_by,
        created_at,
        updated_at,
        pet: pets!inner(name),
        owner: users!owner_id(full_name, email),
        service: services!inner(name),
        branch: branches!inner(name, address),
        staff: users!created_by(full_name)
      `)
      .eq('brand_id', this.brand_id);

    if (this.role === UserRole.CUSTOMER) {
      query = query.eq('owner_id', this.user_id);
    } else if (this.role === UserRole.STAFF || this.role === UserRole.ADMIN) {
      if (this.branch_id) {
        query = query.eq('branch_id', this.branch_id);
      }
    }

    const { data, error } = await query.order('start_time', { ascending: true });
    if (error) throw error;

    return data.map(a => ({
      ...a,
      pet_name: a.pet.name,
      owner_name: a.owner.full_name || 'Unknown',
      owner_email: a.owner.email,
      service_name: a.service.name,
      branch_name: a.branch.name,
      branch_address: a.branch.address,
      staff_name: a.staff.full_name || 'Staff',
    })) as AppointmentWithRelations[];
  }

  /**
   * Get single appointment
   */
  async getById(id: string): Promise<AppointmentWithRelations | null> {
    let query = this.supabase
      .from('appointments')
      .select(`
        appointment_id,
        brand_id,
        branch_id,
        pet_id,
        owner_id,
        service_id,
        start_time,
        end_time,
        status,
        payment_status,
        notes,
        created_by,
        created_at,
        updated_at,
        pet: pets!inner(name),
        owner: users!owner_id(full_name, email),
        service: services!inner(name),
        branch: branches!inner(name, address),
        staff: users!created_by(full_name)
      `)
      .eq('appointment_id', id)
      .eq('brand_id', this.brand_id);

    if (this.role === UserRole.CUSTOMER) {
      query = query.eq('owner_id', this.user_id);
    } else if (this.role === UserRole.STAFF || this.role === UserRole.ADMIN) {
      if (this.branch_id) {
        query = query.eq('branch_id', this.branch_id);
      }
    }

    const { data, error } = await query.single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      ...data,
      pet_name: data.pet.name,
      owner_name: data.owner.full_name || 'Unknown',
      owner_email: data.owner.email,
      service_name: data.service.name,
      branch_name: data.branch.name,
      branch_address: data.branch.address,
      staff_name: data.staff.full_name || 'Staff',
    } as AppointmentWithRelations;
  }

  /**
   * Update appointment
   */
  async update(id: string, input: AppointmentUpdateInput): Promise<AppointmentWithRelations> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Appointment not found');
    }

    const updateData: any = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    // Re-validate time if changed
    if (input.start_time || input.service_id) {
      const settings = await this.settingsService.getBranchSettings(this.brand_id, existing.branch_id);
      const newStartTime = input.start_time || existing.start_time;
      const newServiceId = input.service_id || existing.service_id;
      await this.validateTime(settings, existing.branch_id, newServiceId, newStartTime);
      
      // Update end_time if service changed
      if (input.service_id) {
        const {  service } = await this.supabase
          .from('services')
          .select('duration_minutes')
          .eq('service_id', newServiceId)
          .eq('brand_id', this.brand_id)
          .single();
        
        if (service) {
          const end_time = new Date(newStartTime);
          end_time.setMinutes(end_time.getMinutes() + service.duration_minutes);
          updateData.end_time = end_time.toISOString();
        }
      }
    }

    const { data, error } = await this.supabase
      .from('appointments')
      .update(updateData)
      .eq('appointment_id', id)
      .eq('brand_id', this.brand_id)
      .select(`
        appointment_id,
        brand_id,
        branch_id,
        pet_id,
        owner_id,
        service_id,
        start_time,
        end_time,
        status,
        payment_status,
        notes,
        created_by,
        created_at,
        updated_at,
        pet: pets!inner(name),
        owner: users!owner_id(full_name, email),
        service: services!inner(name),
        branch: branches!inner(name, address),
        staff: users!created_by(full_name)
      `)
      .single();

    if (error) throw error;

    const updated = {
      ...data,
      pet_name: data.pet.name,
      owner_name: data.owner.full_name || 'Unknown',
      owner_email: data.owner.email,
      service_name: data.service.name,
      branch_name: data.branch.name,
      branch_address: data.branch.address,
      staff_name: data.staff.full_name || 'Staff',
    } as AppointmentWithRelations;

    // Send confirmation if status changed to CONFIRMED
    if (input.status === AppointmentStatus.CONFIRMED) {
      const settings = await this.settingsService.getBranchSettings(this.brand_id, updated.branch_id);
      const notificationData: NotificationData = {
        appointment_id: updated.appointment_id,
        pet_name: updated.pet_name,
        owner_name: updated.owner_name,
        owner_email: updated.owner_email,
        service_name: updated.service_name,
        start_time: updated.start_time,
        branch_name: updated.branch_name,
        branch_address: updated.branch_address,
        custom_message: settings.booking_confirmation_message || undefined,
        currency: settings.currency,
      };

      await this.notificationService.create({
        user_id: updated.owner_id,
        sender_id: this.user_id,
        notification_type: NotificationType.APPOINTMENT,
        title: 'Appointment Confirmed',
        message: `Your ${updated.service_name} is confirmed for ${formatManilaDateTime(updated.start_time)}`,
        link_url: `/appointments/${updated.appointment_id}`,
        visible_to_customer: true,
        visible_to_admin: false,
        branch_id: updated.branch_id,
        shouldEmail: settings.enable_notifications && settings.enable_email_notifications,
        emailData: notificationData,
      });
    }

    return updated;
  }

  /**
   * Cancel appointment
   */
  async cancel(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Appointment not found');
    }

    const settings = await this.settingsService.getBranchSettings(this.brand_id, existing.branch_id);
    const now = new Date();
    const cancelDeadline = new Date(existing.start_time);
    cancelDeadline.setHours(cancelDeadline.getHours() - settings.appointment_cancellation_window);

    if (now > cancelDeadline && this.role === UserRole.CUSTOMER) {
      throw new Error(`Cancellation must be made at least ${settings.appointment_cancellation_window} hours before appointment`);
    }

    const { error } = await this.supabase
      .from('appointments')
      .update({ 
        status: AppointmentStatus.CANCELLED,
        updated_at: new Date().toISOString()
      })
      .eq('appointment_id', id)
      .eq('brand_id', this.brand_id);

    if (error) throw error;

    // Prepare notification data
    const notificationData: NotificationData = {
      appointment_id: existing.appointment_id,
      pet_name: existing.pet_name,
      owner_name: existing.owner_name,
      owner_email: existing.owner_email,
      service_name: existing.service_name,
      start_time: existing.start_time,
      branch_name: existing.branch_name,
      branch_address: existing.branch_address,
      custom_message: settings.booking_confirmation_message || undefined,
      currency: settings.currency,
    };

    const isCustomerCancelling = this.role === UserRole.CUSTOMER;
    const cancelledBy = isCustomerCancelling ? 'customer' : 'staff';

    // Notify customer
    await this.notificationService.create({
      user_id: existing.owner_id,
      notification_type: NotificationType.APPOINTMENT,
      title: 'Appointment Cancelled',
      message: `Your appointment for ${existing.pet_name} has been cancelled`,
      link_url: `/appointments/${id}`,
      visible_to_customer: true,
      visible_to_admin: false,
      branch_id: existing.branch_id,
      shouldEmail: settings.enable_notifications && settings.enable_email_notifications,
      emailData: notificationData,
    });

    // Notify staff if customer cancelled
    if (isCustomerCancelling) {
      await this.notificationService.create({
        user_id: existing.created_by,
        notification_type: NotificationType.APPOINTMENT,
        title: 'Appointment Cancelled by Customer',
        message: `${existing.owner_name} cancelled ${existing.pet_name}'s appointment`,
        link_url: `/appointments/${id}`,
        visible_to_admin: true,
        visible_to_customer: false,
        branch_id: existing.branch_id,
      });
    }
  }

  /**
   * Resend notification for appointment
   */
  async resendNotification(id: string): Promise<void> {
    const appointment = await this.getById(id);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const settings = await this.settingsService.getBranchSettings(this.brand_id, appointment.branch_id);
    const notificationData: NotificationData = {
      appointment_id: appointment.appointment_id,
      pet_name: appointment.pet_name,
      owner_name: appointment.owner_name,
      owner_email: appointment.owner_email,
      service_name: appointment.service_name,
      start_time: appointment.start_time,
      branch_name: appointment.branch_name,
      branch_address: appointment.branch_address,
      custom_message: settings.booking_confirmation_message || undefined,
      currency: settings.currency,
    };

    await this.notificationService.create({
      user_id: appointment.owner_id,
      sender_id: this.user_id,
      notification_type: NotificationType.APPOINTMENT,
      title: 'Appointment Confirmation (Resent)',
      message: `Your ${appointment.service_name} is confirmed for ${formatManilaDateTime(appointment.start_time)}`,
      link_url: `/appointments/${appointment.appointment_id}`,
      visible_to_customer: true,
      visible_to_admin: false,
      branch_id: appointment.branch_id,
      shouldEmail: settings.enable_notifications && settings.enable_email_notifications,
      emailData: notificationData,
    });
  }

  /**
   * Get upcoming appointments for admin dashboard
   */
  async getUpcoming(branch_id: string): Promise<AppointmentWithRelations[]> {
    const startDate = new Date();
    const endDate = addDays(startDate, 7); // Next 7 days

    const { data, error } = await this.supabase
      .from('appointments')
      .select(`
        appointment_id,
        brand_id,
        branch_id,
        pet_id,
        owner_id,
        service_id,
        start_time,
        end_time,
        status,
        payment_status,
        notes,
        created_by,
        created_at,
        updated_at,
        pet: pets!inner(name),
        owner: users!owner_id(full_name, email, phone),
        service: services!inner(name),
        branch: branches!inner(name, address),
        staff: users!created_by(full_name)
      `)
      .eq('brand_id', this.brand_id)
      .eq('branch_id', branch_id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;

    return data.map(a => ({
      ...a,
      pet_name: a.pet.name,
      owner_name: a.owner.full_name || 'Unknown',
      owner_email: a.owner.email,
      service_name: a.service.name,
      branch_name: a.branch.name,
      branch_address: a.branch.address,
      staff_name: a.staff.full_name || 'Staff',
    })) as AppointmentWithRelations[];
  }

  // --- PRIVATE HELPERS ---

  private isHoliday(date: string, settings: BranchSettings): boolean {
    if (!settings.holiday_dates) return false;
    
    // Check explicit holiday
    if (settings.holiday_dates[date] === true) return true;
    
    // Check weekend exclusion
    if (settings.holiday_dates.exclude_weekends && isWeekend(date)) {
      return true;
    }
    
    return false;
  }

  private calculateAvailableSlots(duration: number, settings: BranchSettings): number {
    const startMinutes = this.timeToMinutes(settings.start_work_hour);
    const endMinutes = this.timeToMinutes(settings.end_work_hour);
    const slotLength = duration + settings.appointment_gap_minutes;
    return Math.floor((endMinutes - startMinutes) / slotLength);
  }

  private generateSlotsForDay(settings: BranchSettings, duration: number): string[] {
    const startMinutes = this.timeToMinutes(settings.start_work_hour);
    const endMinutes = this.timeToMinutes(settings.end_work_hour);
    const slotLength = duration + settings.appointment_gap_minutes;
    const interval = settings.slot_interval_minutes;
    const slots: string[] = [];

    for (let mins = startMinutes; mins + duration <= endMinutes; mins += interval) {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }

    return slots;
  }

  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async validateTime(
    settings: BranchSettings,
    branch_id: string,
    service_id: string,
    start_time: string
  ) {
    // Convert to UTC for comparison
    const startTimeUtc = toUtc(start_time);
    const now = new Date();

    // Check if in the past
    if (startTimeUtc < now) {
      throw new Error('Cannot book appointments in the past');
    }

    // Check working hours
    const manilaTime = new Date(start_time);
    const timeInMinutes = manilaTime.getHours() * 60 + manilaTime.getMinutes();
    const startWorkMinutes = this.timeToMinutes(settings.start_work_hour);
    const endWorkMinutes = this.timeToMinutes(settings.end_work_hour);

    if (timeInMinutes < startWorkMinutes || timeInMinutes >= endWorkMinutes) {
      throw new Error(`Appointment must be between ${settings.start_work_hour} and ${settings.end_work_hour}`);
    }

    // Check service
    const {  service } = await this.supabase
      .from('services')
      .select('duration_minutes, active')
      .eq('service_id', service_id)
      .eq('brand_id', this.brand_id)
      .single();

    if (!service || !service.active) {
      throw new Error('Service is inactive or not found');
    }

    // Check overlap
    const endTime = new Date(startTimeUtc);
    endTime.setMinutes(endTime.getMinutes() + service.duration_minutes);

    const {  overlaps } = await this.supabase
      .from('appointments')
      .select('appointment_id')
      .eq('brand_id', this.brand_id)
      .eq('branch_id', branch_id)
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTimeUtc.toISOString());

    if (overlaps.length > 0) {
      throw new Error('Time slot is already booked');
    }

    // Check daily quota
    const appointmentDate = startTimeUtc.toISOString().split('T')[0];
    const { count: currentBookings } = await this.supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', this.brand_id)
      .eq('branch_id', branch_id)
      .gte('start_time', `${appointmentDate}T00:00:00Z`)
      .lt('start_time', `${addDays(new Date(appointmentDate), 1).toISOString().split('T')[0]}T00:00:00Z`);

    if (settings.max_daily_appointments !== null && 
        (currentBookings || 0) >= settings.max_daily_appointments) {
      throw new Error('Daily appointment limit reached');
    }
  }

  private async createPassportEntryIfMissing(pet_id: string, branch_id: string): Promise<void> {
    const { count } = await this.supabase
      .from('pet_passport_entries')
      .select('*', { count: 'exact', head: true })
      .eq('pet_id', pet_id)
      .eq('brand_id', this.brand_id);

    if ((count || 0) === 0) {
      await this.supabase
        .from('pet_passport_entries')
        .insert({
          pet_id,
          brand_id: this.brand_id,
          branch_id,
          staff_id: this.user_id,
          entry_type: 'CHECKUP',
          title: 'Initial Visit',
          visible_to_owner: true,
        });
    }
  }
}