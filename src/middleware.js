import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|.*\\..*|sign-in|sign-up).*)', // protect all routes except static/auth
  ],
};
