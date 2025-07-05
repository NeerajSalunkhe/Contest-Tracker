import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ToastContainer } from 'react-toastify';
import { auth } from '@clerk/nextjs/server';
import Navbar from './components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Contest Tracker',
  description: 'Track all coding contests in one place',
  icons: {
    icon: '/bell.svg', // relative to /public
  },
};


export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
          {/* <ToastContainer /> */}
        </body>
      </html>
    </ClerkProvider>
  );
}
