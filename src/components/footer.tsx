import { Logo } from "./logo";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="bg-secondary/50 py-12">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 md:grid-cols-3 md:px-6">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="text-muted-foreground">
            Compassionate and comprehensive care for your beloved pets.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Contact Us</h3>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            <span>123 Pet Lane, Animal City, 12345</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-accent" />
            <span>(123) 456-7890</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent" />
            <span>contact@vetconnect.com</span>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Opening Hours</h3>
          <p className="text-muted-foreground">
            Monday - Friday: 9:00 AM - 6:00 PM
            <br />
            Saturday: 10:00 AM - 4:00 PM
            <br />
            Sunday: Closed
          </p>
        </div>
      </div>
      <div className="container mx-auto mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} VetConnect. All rights reserved.</p>
      </div>
    </footer>
  );
}
