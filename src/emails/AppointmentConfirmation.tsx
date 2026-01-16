import { Button, Html, Body, Container, Text, Heading, Section, Hr } from '@react-email/components';
import { NotificationData } from '@/types/email';
import { formatManilaDateTime } from '@/lib/time-helpers';

interface Props {
   data: NotificationData;
}

export default function AppointmentConfirmation({ data }: Props) {
  const formattedTime = formatManilaDateTime(data.start_time);
  const appointmentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/appointments/${data.appointment_id}`;

  return (
    <Html>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', maxWidth: '600px', margin: '40px auto' }}>
          <Heading style={{ color: '#111827', fontSize: '24px', fontWeight: 'bold' }}>
            ✅ Appointment Confirmed
          </Heading>
          <Text style={{ color: '#374151', fontSize: '16px' }}>
            Dear {data.owner_name},
          </Text>
          <Text style={{ color: '#374151', fontSize: '16px' }}>
            Your appointment for <strong>{data.pet_name}</strong> has been confirmed!
          </Text>
          
          <Section style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
            <Text style={{ margin: '8px 0', fontSize: '16px' }}>
              <strong>Service:</strong> {data.service_name}
            </Text>
            <Text style={{ margin: '8px 0', fontSize: '16px' }}>
              <strong>Date & Time:</strong> {formattedTime}
            </Text>
            <Text style={{ margin: '8px 0', fontSize: '16px' }}>
              <strong>Branch:</strong> {data.branch_name}
            </Text>
            <Text style={{ margin: '8px 0', fontSize: '16px' }}>
              <strong>Address:</strong> {data.branch_address}
            </Text>
          </Section>

          {data.custom_message && (
            <Section style={{ marginTop: '20px' }}>
              <Hr />
              <Text style={{ fontStyle: 'italic', color: '#6b7280', fontSize: '14px' }}>
                {data.custom_message}
              </Text>
            </Section>
          )}

          <Button
            href={appointmentUrl}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px',
              display: 'inline-block',
              marginTop: '24px',
              fontWeight: 'bold',
            }}
          >
            View Appointment Details
          </Button>
        </Container>
      </Body>
    </Html>
  );
}