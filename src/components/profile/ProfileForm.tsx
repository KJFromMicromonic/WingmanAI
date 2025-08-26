'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { User, Calendar, Briefcase, Heart, ChevronRight } from 'lucide-react';
import { 
  Gender, 
  RelationshipStatus, 
  ProfessionalStatus,
  ProfileUpdateData 
} from '@/lib/supabase/types';

interface ProfileFormProps {
  initialData?: Partial<ProfileUpdateData>;
  onSubmit: (data: ProfileUpdateData) => void;
  onSkip?: () => void;
  isOnboarding?: boolean;
  loading?: boolean;
}

export function ProfileForm({ 
  initialData, 
  onSubmit, 
  onSkip, 
  isOnboarding = false, 
  loading = false 
}: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: initialData?.name || '',
    date_of_birth: initialData?.date_of_birth || '',
    professional_status: initialData?.professional_status || undefined,
    gender: initialData?.gender || undefined,
    relationship_status: initialData?.relationship_status || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const genderOptions: { value: Gender; label: string; description?: string }[] = [
    { value: 'man', label: 'Man' },
    { value: 'woman', label: 'Woman' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'genderfluid', label: 'Genderfluid' },
    { value: 'agender', label: 'Agender' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
    { value: 'other', label: 'Other' },
  ];

  const relationshipOptions: { value: RelationshipStatus; label: string }[] = [
    { value: 'single', label: 'Single' },
    { value: 'dating', label: 'Dating' },
    { value: 'in-a-relationship', label: 'In a relationship' },
    { value: 'engaged', label: 'Engaged' },
    { value: 'married', label: 'Married' },
    { value: 'its-complicated', label: "It's complicated" },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  const professionalOptions: { value: ProfessionalStatus; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'employed', label: 'Employed' },
    { value: 'self-employed', label: 'Self-employed' },
    { value: 'unemployed', label: 'Looking for work' },
    { value: 'retired', label: 'Retired' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'entrepreneur', label: 'Entrepreneur' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        newErrors.date_of_birth = 'You must be at least 13 years old to use this service';
      } else if (age > 120) {
        newErrors.date_of_birth = 'Please enter a valid birth date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Filter out empty values
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '' && value !== undefined)
      ) as ProfileUpdateData;
      
      onSubmit(cleanedData);
    }
  };

  const handleInputChange = (field: keyof ProfileUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8"
      >
        {isOnboarding && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
            <p className="text-slate-400">
              Help us personalize your experience by sharing a few details about yourself.
              All information is optional and kept private.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.name ? 'border-red-500' : 'border-slate-600'
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.date_of_birth ? 'border-red-500' : 'border-slate-600'
              }`}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date_of_birth && (
              <p className="mt-1 text-sm text-red-400">{errors.date_of_birth}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              This helps us provide age-appropriate content and better recommendations
            </p>
          </div>

          {/* Professional Status */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Briefcase className="w-4 h-4 inline mr-2" />
              Professional Status (Optional)
            </label>
            <select
              value={formData.professional_status || ''}
              onChange={(e) => handleInputChange('professional_status', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select your professional status</option>
              {professionalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Gender Identity (Optional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('gender', option.value)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.gender === option.value
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              We're committed to creating an inclusive space for everyone
            </p>
          </div>

          {/* Relationship Status */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              <Heart className="w-4 h-4 inline mr-2" />
              Relationship Status (Optional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {relationshipOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('relationship_status', option.value)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.relationship_status === option.value
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              This helps us tailor scenarios to your personal goals
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  {isOnboarding ? 'Complete Profile' : 'Save Changes'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            
            {onSkip && isOnboarding && (
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Skip for now
              </Button>
            )}
          </div>
        </form>

        {isOnboarding && (
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-white mb-2">Privacy Notice</h4>
            <p className="text-xs text-slate-400">
              Your personal information is encrypted and secure. We use this data only to 
              improve your experience and will never share it with third parties without your consent.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
