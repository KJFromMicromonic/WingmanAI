'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatInterfaceProps {
  onInteraction: () => void;
  placeholder?: string;
  title?: string;
  subtitle?: string;
}

export function ChatInterface({ 
  onInteraction, 
  placeholder = "Talk to WingMan...",
  title = "Talk to WingMan",
  subtitle = "Practice conversations and get instant feedback"
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInteraction();
  };

  const handleVoiceClick = () => {
    onInteraction();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Chat Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-slate-300">{subtitle}</p>
      </div>

      {/* Chat Interface */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
        {/* Chat Display Area */}
        <div className="bg-slate-900/50 rounded-xl p-4 mb-4 min-h-[200px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-slate-400 text-lg mb-2">Ready to practice your social skills?</p>
            <p className="text-slate-500 text-sm">Start a conversation or try voice practice below</p>
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 pr-12 h-12 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-8 w-8 p-0 rounded-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            type="button"
            onClick={handleVoiceClick}
            variant="outline"
            size="lg"
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 h-12 px-4 rounded-xl"
          >
            <Mic className="w-5 h-5 mr-2" />
            Voice
          </Button>
        </form>

        {/* Quick Suggestions */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {[
            "How do I start conversations?",
            "Practice job interviews",
            "Dating confidence tips",
            "Social anxiety help"
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={onInteraction}
              className="px-3 py-1.5 bg-slate-700/30 hover:bg-slate-600/50 text-slate-300 text-sm rounded-full border border-slate-600/50 hover:border-purple-500/50 transition-all duration-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-2 gap-4 mt-6 text-center">
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
          <MessageCircle className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-slate-300 text-sm font-medium">Text Practice</p>
          <p className="text-slate-500 text-xs">Chat with AI companions</p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
          <Mic className="w-6 h-6 text-pink-400 mx-auto mb-2" />
          <p className="text-slate-300 text-sm font-medium">Voice Practice</p>
          <p className="text-slate-500 text-xs">Real conversation training</p>
        </div>
      </div>
    </motion.div>
  );
}
