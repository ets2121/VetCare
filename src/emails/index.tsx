import AppointmentConfirmation from './AppointmentConfirmation';
import AppointmentCancellation from './AppointmentCancellation';
import { render } from '@react-email/render';
import { NotificationData } from '@/types/email';

export async function renderConfirmationEmail(
  data: NotificationData
): Promise<string> {
  return render(<AppointmentConfirmation data={data} />);
}

export async function renderCancellationEmail(
  data: NotificationData,
  cancelledBy: 'customer' | 'staff'
): Promise<string> {
  return render(
    <AppointmentCancellation
      data={data}
      cancelledBy={cancelledBy}
    />
  );
}
