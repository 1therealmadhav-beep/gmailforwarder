import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Gmail Forwarder - Automate Your Email Forwarding',
  description: 'Automatically forward Gmail emails based on custom rules. Admin and user panels with Firebase Realtime Database.',
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}