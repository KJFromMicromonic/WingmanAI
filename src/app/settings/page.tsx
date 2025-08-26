'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { updateUserProfile, getUserDashboardData, ProfileUpdateData } from '@/lib/user';
import { useUserData } from '@/hooks/useUser';
import { 
  User, 
  Crown, 
  Shield, 
  Calendar, 
  Activity, 
  Database,
  ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user: clerkUser } = useUser();
  const { userData, loading: userLoading } = useUserData();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (clerkUser) {
        const data = await getUserDashboardData(clerkUser.id);
        setDashboardData(data);
      }
    };
    fetchDashboardData();
  }, [clerkUser]);

  const handleProfileUpdate = async (profileData: ProfileUpdateData) => {
    if (!clerkUser) return;

    setLoading(true);
    setMessage(null);

    try {
      const success = await updateUserProfile(clerkUser.id, profileData);
      
      if (success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Refresh user data
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating your profile.' });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading settings...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'data', label: 'Your Data', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-slate-400">Manage your account and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-900/20 border border-green-500/20 text-green-400'
                    : 'bg-red-900/20 border border-red-500/20 text-red-400'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
                <ProfileForm
                  initialData={{
                    name: userData.name,
                    date_of_birth: userData.date_of_birth,
                    professional_status: userData.professional_status,
                    gender: userData.gender,
                    relationship_status: userData.relationship_status,
                  }}
                  onSubmit={handleProfileUpdate}
                  loading={loading}
                />
              </div>
            )}

            {activeTab === 'subscription' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Subscription Details</h2>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white capitalize">
                        {userData.subscription_tier} Plan
                      </h3>
                      <p className="text-slate-400">
                        {userData.is_premium ? 'Premium features enabled' : 'Free tier with limited features'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      userData.is_premium 
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                        : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
                    }`}>
                      {userData.is_premium ? 'Premium' : 'Free'}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Member since:</span>
                      <span className="text-white">
                        {new Date(userData.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Last login:</span>
                      <span className="text-white">
                        {new Date(userData.last_login).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current streak:</span>
                      <span className="text-white">{userData.streak} days</span>
                    </div>
                  </div>

                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    {userData.is_premium ? 'Manage Subscription' : 'Upgrade to Premium'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Privacy & Security</h2>
                <div className="space-y-6">
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-medium text-white mb-4">Data Privacy</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Profile Visibility</p>
                          <p className="text-sm text-slate-400">Control who can see your profile information</p>
                        </div>
                        <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
                          <option>Private</option>
                          <option>Friends Only</option>
                          <option>Public</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Data Analytics</p>
                          <p className="text-sm text-slate-400">Allow us to analyze your usage for improvements</p>
                        </div>
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg">Enabled</button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-medium text-white mb-4">Account Security</h3>
                    <div className="space-y-4">
                      <Button variant="outline" className="border-slate-600 text-slate-300">
                        Change Password
                      </Button>
                      <Button variant="outline" className="border-slate-600 text-slate-300">
                        Enable Two-Factor Authentication
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Your Data</h2>
                
                {dashboardData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <Activity className="w-8 h-8 text-purple-400" />
                        <span className="text-2xl font-bold text-white">{dashboardData.totalConversations}</span>
                      </div>
                      <h3 className="text-white font-medium">Total Conversations</h3>
                      <p className="text-slate-400 text-sm">Practice sessions completed</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <Calendar className="w-8 h-8 text-green-400" />
                        <span className="text-2xl font-bold text-white">{dashboardData.streak}</span>
                      </div>
                      <h3 className="text-white font-medium">Current Streak</h3>
                      <p className="text-slate-400 text-sm">Days of consistent practice</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <User className="w-8 h-8 text-blue-400" />
                        <span className="text-2xl font-bold text-white">{dashboardData.level.level}</span>
                      </div>
                      <h3 className="text-white font-medium">{dashboardData.level.title}</h3>
                      <p className="text-slate-400 text-sm">Your current level</p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-medium text-white mb-4">Data Management</h3>
                  <div className="space-y-4">
                    <Button variant="outline" className="border-slate-600 text-slate-300">
                      Download Your Data
                    </Button>
                    <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/10">
                      Delete Account
                    </Button>
                  </div>
                  
                  <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <h4 className="text-sm font-medium text-white mb-2">Data Retention Policy</h4>
                    <p className="text-xs text-slate-400">
                      Your conversation data is kept for analytics and improvement purposes. 
                      Personal information is stored securely and can be deleted upon request.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}