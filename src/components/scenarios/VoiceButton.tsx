'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Headphones } from 'lucide-react';
import { VoiceMode, VOICE_PERSONAS } from '@/components/voice/VoiceMode';
import { motion } from 'framer-motion';

interface VoiceButtonProps {
  scenarioId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  userId: string;
  disabled?: boolean;
}

export function VoiceButton({ scenarioId, difficulty, userId, disabled }: VoiceButtonProps) {
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  
  // Get persona for this scenario
  const persona = VOICE_PERSONAS[scenarioId as keyof typeof VOICE_PERSONAS];
  
  if (!persona) {
    return null; // Don't show button if persona not configured
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={() => setShowVoiceMode(true)}
          disabled={disabled}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg shadow-lg"
        >
          <Headphones className="w-5 h-5 mr-2" />
          Voice Practice with {persona.name}
          <div className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
            {persona.gender === 'female' ? '♀' : '♂'} {persona.voice.split('-').pop()}
          </div>
        </Button>
      </motion.div>

      {showVoiceMode && (
        <VoiceMode
          scenarioId={scenarioId}
          difficulty={difficulty}
          userId={userId}
          onClose={() => setShowVoiceMode(false)}
        />
      )}
    </>
  );
}