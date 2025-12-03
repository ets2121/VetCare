import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { HeartPulse, Scissors, Stethoscope } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const ToothIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8 text-accent"
  >
    <path d="M9.34 4.23a3.5 3.5 0 0 0-5.18 5.18l5.18 5.18a3.5 3.5 0 0 0 5.18-5.18Z" />
    <path d="m14.23 15.2-1.56-1.56a2.5 2.5 0 0 1 0-3.53l1.56-1.56a2.5 2.5 0 0 1 3.53 0l1.56 1.56a2.5 2.5 0 0 1 0 3.53l-1.56 1.56a2.5 2.5 0 0 1-3.53 0Z" />
  </svg>
);


const VaccineIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-accent"><path d="m12.5 3-10 10 3.5 3.5 10-10-3.5-3.5Z"/><path d="m18 8 2 2"/><path d="m21 11-6 6"/><path d="m3 21 6-6"/></svg>
);

export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === 'hero-dog');
  const serviceExamImage = PlaceHolderImages.find((p) => p.id === 'service-exam');
  const serviceVaccineImage = PlaceHolderImages.find((p) => p.id === 'service-vaccine');
  const serviceDentalImage = PlaceHolderImages.find((p) => p.id === 'service-dental');
  const serviceSurgeryImage = PlaceHolderImages.find((p) => p.id === 'service-surgery');
  const aboutImage = PlaceHolderImages.find((p) => p.id === 'about-us');

  const services = [
    {
      icon: <Stethoscope className="h-8 w-8 text-accent" />,
      title: 'Wellness Exams',
      description: 'Comprehensive check-ups to keep your pet healthy and happy.',
      image: serviceExamImage,
    },
    {
      icon: <VaccineIcon />,
      title: 'Vaccinations',
      description: 'Protecting your furry friends from common and serious diseases.',
      image: serviceVaccineImage,
    },
    {
      icon: <ToothIcon />,
      title: 'Dental Care',
      description: 'Full dental services, from cleaning to extractions, for optimal oral health.',
      image: serviceDentalImage,
    },
    {
      icon: <Scissors className="h-8 w-8 text-accent" />,
      title: 'Surgery',
      description: 'State-of-the-art surgical procedures with compassionate post-op care.',
      image: serviceSurgeryImage,
    },
  ];

  return (
    <>
      <section className="relative w-full h-[60vh] md:h-[80vh]">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight animate-fade-in-down">
            Compassionate Care for Your Best Friend
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-primary-foreground/80 animate-fade-in-up">
            At VetConnect, we treat your pets like family. Expert care, modern facilities, and a whole lot of love.
          </p>
          <div className="mt-8 flex gap-4">
            <Button asChild size="lg" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
              <Link href="/signup">Book an Appointment</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/#services">Our Services</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="services" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Services</h2>
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
              We offer a wide range of veterinary services to ensure your pet receives the best possible care.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <Card key={service.title} className="flex flex-col overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                 {service.image && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={service.image.imageUrl}
                      alt={service.image.description}
                      data-ai-hint={service.image.imageHint}
                      fill
                      className="object-cover"
                    />
                  </div>
                 )}
                <CardHeader className="flex-row items-center gap-4">
                  {service.icon}
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <section id="about" className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-headline">About VetConnect</h2>
              <p className="mt-4 text-muted-foreground">
                VetConnect was founded with a simple mission: to provide the highest quality veterinary care in a friendly, welcoming environment. Our team of experienced veterinarians and staff are all passionate animal lovers dedicated to the health and well-being of your pets.
              </p>
              <p className="mt-4 text-muted-foreground">
                We believe in building lasting relationships with our clients and their pets, based on trust, communication, and compassionate care. From routine check-ups to complex medical issues, we're here to support you every step of the way.
              </p>
              <Button asChild size="lg" className="mt-6" variant="outline">
                <Link href="#">Meet Our Team</Link>
              </Button>
            </div>
             {aboutImage && (
                <div className="relative h-80 w-full rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={aboutImage.imageUrl}
                    alt={aboutImage.description}
                    data-ai-hint={aboutImage.imageHint}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
          </div>
        </div>
      </section>
    </>
  );
}
