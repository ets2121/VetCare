import { Button, Html, Body, Container, Text, Heading, Section } from '@react-email/components';
import { NotificationData } from '@/types/email';
import { formatManilaDateTime } from '@/lib/time-helpers';

interface Props {
   data: NotificationData;
  cancelledBy: 'customer' | 'staff';
}

export default function AppointmentCancellation({ data, cancelledBy }: Props) {
  const formattedTime = formatManilaDateTime(data.start_time);
  const appointmentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/appointments/${data.appointment_id}`;

  return (
    <Html>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', maxWidth: '600px', margin: '40px auto' }}>
          <Heading style={{ color: '#dc2626', fontSize: '24px', fontWeight: 'bold' }}>
            ❌ Appointment Cancelled
          </Heading>
          <Text style={{ color: '#374151', fontSize: '16px' }}>
            Dear {data.owner_name},
          </Text>
          <Text style={{ color: '#374151', fontSize: '16px' }}>
            Your appointment for <strong>{data.pet_name}</strong> has been cancelled.
          </Text>
          
          <Section style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
            <Text style={{ margin: '8px 0', fontSize: '16px' }}>
              <strong>Service:</strong> {data.service_name}
            </Text>
            <Text style={{ margin: '8px 0', fontSize: '16px' }}>
              <strong>Scheduled Time:</strong> {formattedTime}
            </Text>
            <Text style={{ margin: '8px 0', fontSize: '16px' }}>
              <strong>Cancelled By:</strong> {cancelledBy === 'customer' ? 'You' : 'Clinic Staff'}
            </Text>
          </Section>

          <Button
            href={appointmentUrl}
            style={{
              backgroundColor: '#6b7280',
              color: '#ffffff',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px',
              display: 'inline-block',
              marginTop: '24px',
              fontWeight: 'bold',
            }}
          >
            View Cancellation Details
          </Button>
        </Container>
      </Body>
    </Html>
  );
}