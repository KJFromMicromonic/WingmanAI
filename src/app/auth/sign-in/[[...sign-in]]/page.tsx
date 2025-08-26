import { SignIn } from '@clerk/nextjs';

/**
 * Sign-in page component with catchall routing for Clerk.
 *
 * Handles Clerk's internal routing for the sign-in flow including
 * verification, password reset, and other authentication states.
 *
 * @returns JSX element containing the sign-in form
 */
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md">
        <SignIn 
          redirectUrl="/onboarding"
          appearance={{
            elements: {
              formButtonPrimary: 
                'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm normal-case',
              card: 'bg-slate-800 border border-slate-700',
              headerTitle: 'text-white',
              headerSubtitle: 'text-slate-400',
              formFieldInput: 'bg-slate-700 border-slate-600 text-white',
              formFieldLabel: 'text-slate-300',
              footerActionLink: 'text-purple-400 hover:text-purple-300',
            },
          }}
        />
      </div>
    </div>
  );
} 