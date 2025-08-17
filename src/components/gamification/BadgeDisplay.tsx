'use client';

import { motion } from 'framer-motion';
import { Trophy, Star, Calendar, MessageCircle } from 'lucide-react';

const badges = [
  { id: 'first-chat', name: 'First Chat', icon: MessageCircle, earned: true, description: 'Complete your first conversation' },
  { id: 'streak-7', name: '7-Day Streak', icon: Calendar, earned: true, description: 'Practice for 7 consecutive days' },
  { id: 'icebreaker', name: 'Icebreaker Pro', icon: Star, earned: false, description: 'Successfully start 10 conversations' },
  { id: 'conversationalist', name: 'Conversationalist', icon: MessageCircle, earned: false, description: 'Have 20 successful conversations' },
  { id: 'voice-master', name: 'Voice Master', icon: Star, earned: false, description: 'Complete 5 voice conversations (Premium)' },
  { id: 'scenario-master', name: 'Scenario Master', icon: Trophy, earned: false, description: 'Complete all beginner scenarios' }
];

export function BadgeDisplay() {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Your Badges</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            className={`p-4 rounded-lg border text-center ${
              badge.earned 
                ? 'bg-purple-500/10 border-purple-500/30' 
                : 'bg-slate-700/50 border-slate-600 opacity-50'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
              badge.earned ? 'bg-purple-500/20' : 'bg-slate-600'
            }`}>
              <badge.icon className={`w-6 h-6 ${
                badge.earned ? 'text-purple-400' : 'text-slate-500'
              }`} />
            </div>
            <h4 className={`font-medium text-sm ${
              badge.earned ? 'text-white' : 'text-slate-400'
            }`}>
              {badge.name}
            </h4>
            <p className={`text-xs mt-1 ${
              badge.earned ? 'text-slate-300' : 'text-slate-500'
            }`}>
              {badge.description}
            </p>
            {!badge.earned && (
              <div className="mt-2 text-xs text-slate-500">
                Locked
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}