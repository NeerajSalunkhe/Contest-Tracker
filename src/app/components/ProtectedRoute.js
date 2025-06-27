'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isLoaded) return; // wait for Clerk to load

    if (!isSignedIn) {
      router.replace('/sign-in'); // redirect immediately
    } else {
      setShouldRender(true); // safe to render children
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !shouldRender) {
    // Optional: show a loader or return null
    return null;
  }

  return children;
}
