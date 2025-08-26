'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { updateUserProfile, completeOnboarding, ProfileUpdateData } from '@/lib/user';
import { SubscriptionTier } from '@/lib/supabase/types';
import { useUserData } from '@/hooks/useUser';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { userData } = useUserData();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if user already completed profile
    if (userData?.profile_completed) {
      router.push('/dashboard');
    }
  }, [userData, router]);

  const handleProfileSubmit = async (profileData: ProfileUpdateData) => {
    if (!clerkUser) return;

    setLoading(true);
    try {
      // Get selected plan from localStorage
      const selectedPlan = localStorage.getItem('selectedPlan') as SubscriptionTier || 'free';
      
      // Update profile
      const profileSuccess = await updateUserProfile(clerkUser.id, profileData);
      
      // Complete onboarding with subscription tier
      const onboardingSuccess = await completeOnboarding(clerkUser.id, selectedPlan);
      
      if (profileSuccess && onboardingSuccess) {
        // Clean up localStorage
        localStorage.removeItem('selectedPlan');
        router.push('/dashboard');
      } else {
        console.error('Failed to complete profile setup');
      }
    } catch (error) {
      console.error('Error completing profile setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  if (!clerkUser || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <ProfileForm
        initialData={{
          name: userData.name,
          date_of_birth: userData.date_of_birth,
          professional_status: userData.professional_status,
          gender: userData.gender,
          relationship_status: userData.relationship_status,
        }}
        onSubmit={handleProfileSubmit}
        onSkip={handleSkip}
        isOnboarding={true}
        loading={loading}
      />
    </div>
  );
}
