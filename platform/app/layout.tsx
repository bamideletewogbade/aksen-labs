import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './readability.css';
import './workspace.css';
import './agency.css';
import './refresh.css';
import './products-and-hero.css';
import './page-openings.css';
import './product-refinement.css';
import './pricing.css';
import './immersive-hero.css';
import './response-text.css';
import './agent-workbench.css';
import './site-interactions.css';
import './motion-system.css';

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
    'Aksen Labs builds websites, connects business systems and develops digital products for African businesses. Based in Ghana, with practical AI and team support.',
  openGraph: {
    title: 'Aksen Labs | Technology that helps your business grow',
    description:
      'Digital transformation for African businesses. Strategy, digital experiences, business systems and practical AI.',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Aksen Labs workflow system',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aksen Labs | Technology that helps your business grow',
    description:
      'Digital transformation for African businesses. Strategy, digital experiences, business systems and practical AI.',
    images: ['/og.jpg'],
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
