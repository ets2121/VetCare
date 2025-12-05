import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'VetConnect - Your Pet\'s Health Partner',
  description: 'Welcome to VetConnect, providing compassionate care for your beloved pets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = headers().get('next-url') || '';
  const authRoutes = ['/login', '/signup', '/admin/login'];
  const showHeaderFooter = !authRoutes.some(route => pathname.endsWith(route));


  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <div className="flex min-h-screen flex-col">
          {showHeaderFooter && <Header />}
          <main className="flex-1">{children}</main>
          {showHeaderFooter && <Footer />}
        </div>
      </body>
    </html>
  );
}
