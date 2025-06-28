'use client';

import { SignedOut, SignIn } from '@clerk/nextjs';
import AuthWrapper from '../auth/AuthWrapper';



export default function AuthLayout() {
  return (
    <SignedOut>
      <AuthWrapper>
        <SignIn routing="hash" />
      </AuthWrapper>
    </SignedOut>
  );
}
