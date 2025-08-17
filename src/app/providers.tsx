'use client';

import { ClerkProvider } from '@clerk/nextjs';

/**
 * Root providers component that wraps the application with necessary providers.
 *
 * This component provides authentication context via Clerk and any other
 * global providers needed throughout the application.
 *
 * @param children React children to be wrapped by providers
 * @returns JSX element with providers wrapping children
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}