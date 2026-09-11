import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './readability.css';
import './workspace.css';
import './agency.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Aksen Labs | Digital Transformation for African Businesses',
  description:
    'Aksen Labs helps African businesses grow with digital experiences, connected business systems, new products and practical AI. Based in Ghana, open to ambition everywhere.',
  openGraph: {
    title: 'Aksen Labs | Technology that helps your business grow',
    description: 'Digital transformation for African businesses. Strategy, digital experiences, business systems and practical AI.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Aksen Labs workflow system' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aksen Labs | Technology that helps your business grow',
    description: 'Digital transformation for African businesses. Strategy, digital experiences, business systems and practical AI.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
