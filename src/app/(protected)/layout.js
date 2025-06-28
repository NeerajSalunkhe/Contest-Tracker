'use client';

import { SignedIn } from '@clerk/nextjs';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';



export default function ProtectedLayout({ children }) {
  return (
    <SignedIn>
      <Navbar />
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    </SignedIn>
  );
}
