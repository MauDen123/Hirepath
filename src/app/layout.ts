import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import React from 'react';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'PLM-HirePath',
  description:
    'Recruitment and career pathing system for Pamantasan ng Lungsod ng Maynila',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return React.createElement(
    'html',
    {
      lang: 'en',
      className: `${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`,
    },
    React.createElement('body', {}, children)
  );
}
