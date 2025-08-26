'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageCircle, Trophy, Mic, Settings, User, Calendar, Target, Award, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { getScenariosByDifficulty, getFreeScenarios, getPremiumScenarios } from '@/lib/scenarios';
import { getPersonaById } from '@/lib/personas';
import { useUserData } from '@/hooks/useUser';
import { useState, useEffect } from 'react';
import { getUserDashboardData } from '@/lib/user';
import { PracticeInterviews } from '@/components/voice/PracticeInterviews';

/**
 * Dashboard page component for authenticated users.
 *
 * Displays user's progress, available features, quick actions,
 * and scenario cards for practicing social interactions
 * in the WingMan AI application.
 *
 * @returns JSX element containing the dashboard interface with scenarios
 */
export default function DashboardPage() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { userData } = useUserData();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isInterviewModalOpen, setInterviewModalOpen] = useState(false);

  // Get scenarios based on user's subscription tier
  const allScenarios = userData?.is_premium ? [...getFreeScenarios(), ...getPremiumScenarios()] : getFreeScenarios();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        const data = await getUserDashboardData(user.id);
        setDashboardData(data);
      }
    };
    fetchDashboardData();
  }, [user]);

  const features = [
    {
      icon: MessageCircle,
      title: "Start Roleplay",
      description: "Practice conversations in realistic scenarios",
      href: "/roleplay",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Briefcase,
      title: "Practice Interviews",
      description: "Prepare for interviews with an AI agent",
      onClick: () => setInterviewModalOpen(true),
      color: "from-green-500 to-green-600"
    },
    {
      icon: Trophy,
      title: "View Progress",
      description: "Check your achievements and stats",
      href: "/progress",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Customize your experience",
      href: "/settings",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <>
      {isInterviewModalOpen && user && (
        <PracticeInterviews 
          userId={user.id} 
          onClose={() => setInterviewModalOpen(false)} 
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <motion.h1 
                className="text-3xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Welcome back, {userData?.name?.split(' ')[0] || user?.firstName || 'User'}!
              </motion.h1>
              <motion.p 
                className="text-slate-400 text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Ready to practice your social skills?
              </motion.p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => signOut()}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Sign Out
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div 
              className="bg-slate-800 p-6 rounded-xl border border-slate-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <MessageCircle className="w-8 h-8 text-purple-400" />
                <p className="text-3xl font-bold text-white">{dashboardData?.totalConversations || 0}</p>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Conversations</h3>
              <p className="text-sm text-slate-400">Total practice sessions</p>
            </motion.div>
            
            <motion.div 
              className="bg-slate-800 p-6 rounded-xl border border-slate-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 text-green-400" />
                <p className="text-3xl font-bold text-white">{userData?.streak || 0}</p>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Streak</h3>
              <p className="text-sm text-slate-400">Days in a row</p>
            </motion.div>
            
            <motion.div 
              className="bg-slate-800 p-6 rounded-xl border border-slate-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-yellow-400" />
                <p className="text-3xl font-bold text-white">{dashboardData?.level.level || 1}</p>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Level</h3>
              <p className="text-sm text-slate-400">{dashboardData?.level.title || 'Beginner'}</p>
            </motion.div>

            <motion.div 
              className="bg-slate-800 p-6 rounded-xl border border-slate-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-blue-400" />
                <p className="text-3xl font-bold text-white">{dashboardData?.completedScenarios || 0}</p>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Scenarios</h3>
              <p className="text-sm text-slate-400">Completed scenarios</p>
            </motion.div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {features.map((feature, index) => {
              const cardContent = (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-purple-500 transition-all duration-300 cursor-pointer group-hover:transform group-hover:scale-105 h-full">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </div>
              );

              return (
                <motion.div
                  key={index}
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  onClick={feature.onClick}
                >
                  {feature.href ? (
                    <Link href={feature.href}>{cardContent}</Link>
                  ) : (
                    cardContent
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Scenario Cards Section */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Practice Scenarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allScenarios.map((scenario, index) => {
                const persona = getPersonaById(scenario.personaId);
                return (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-purple-500 transition-all duration-300 group">
                      <div className="relative h-48">
                        <img
                          src={scenario.image}
                          alt={scenario.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                        <div className="absolute top-4 right-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            scenario.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                            scenario.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {scenario.difficulty}
                          </span>
                        </div>
                        {scenario.isPremium && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                              Premium
                            </span>
                          </div>
                        )}
                        {persona && (
                          <div className="absolute bottom-4 left-4 flex items-center">
                            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                              <User className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-white text-sm font-medium">{persona.name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-2">{scenario.title}</h3>
                        <p className="text-slate-400 text-sm mb-4">{scenario.description}</p>
                        
                        <Link href={`/dashboard/scenarios/${scenario.id}`}>
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                            Start Practice
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>


        </div>
      </div>
    </>
  );
}