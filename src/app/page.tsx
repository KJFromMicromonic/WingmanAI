'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Trophy, Mic, Zap } from 'lucide-react';
import { ChatInterface } from '@/components/ui/chat-interface';

/**
 * Home page component for WingMan AI.
 *
 * Features a hero section with call-to-action buttons, features showcase,
 * and final call-to-action section. Uses framer-motion for animations.
 *
 * @returns JSX element representing the home page
 */
export default function Home() {
  const router = useRouter();

  const handleChatInteraction = () => {
    // Redirect to sign-in page when user tries to interact
    router.push('/auth/sign-in');
  };

  const features = [
    {
      icon: MessageCircle,
      title: "Realistic Roleplay",
      description: "Practice conversations in cafes, bars, parks, and more realistic settings."
    },
    {
      icon: Zap,
      title: "Instant Feedback",
      description: "Get real-time advice on what works and what doesn't in your conversations."
    },
    {
      icon: Trophy,
      title: "Gamified Learning",
      description: "Earn badges, maintain streaks, and level up your social confidence skills."
    },
    {
      icon: Mic,
      title: "Voice Practice",
      description: "Premium feature: Practice speaking with AI using voice conversations."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <motion.h1 
              className="text-4xl md:text-6xl font-extrabold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Train Your <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Confidence</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Practice real conversations with AI companions. Get instant feedback. 
              Build your social skills without fear of rejection.
            </motion.p>
            
            {/* Chat Interface */}
            <ChatInterface onInteraction={handleChatInteraction} />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Build Confidence
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Our AI-powered platform helps you practice social skills in a safe, judgment-free environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-purple-500 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Build Your Confidence?
          </h2>
          <p className="text-xl text-slate-200 mb-8">
            Join thousands of users who have transformed their social skills with WingMan AI.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-white text-purple-900 hover:bg-slate-100 px-8 py-4 text-lg font-semibold shadow-xl">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
