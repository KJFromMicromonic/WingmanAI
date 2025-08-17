'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Send, 
  Lightbulb, 
  Volume2,
  RotateCcw,
  User,
  MapPin,
  Trophy,
  Play
} from 'lucide-react';
import Link from 'next/link';
import { getScenarioById } from '@/lib/scenarios';
import { getPersonaById } from '@/lib/personas';
import { createConversation, addMessageToConversation, saveConversationFeedback } from '@/lib/conversation';
import { useUserData } from '@/hooks/useUser';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export default function ScenarioDetail() {
  const params = useParams();
  const { userData } = useUserData();
  const scenarioId = params.id as string;
  
  const scenario = getScenarioById(scenarioId);
  const persona = scenario ? getPersonaById(scenario.personaId) : null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [coachingTips, setCoachingTips] = useState<any>(null);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [tipsPulse, setTipsPulse] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Initialize scene and coaching tips
  useEffect(() => {
    const initializeScenario = async () => {
      if (scenario && persona) {
        try {
          // Generate scene description
          const sceneResult = await fetch('/api/ai/generate-scene', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              context: {
                scenario: scenario.title,
                personality: persona,
                setting: scenario.setting
              }
            })
          });
          
          if (sceneResult.ok) {
            const sceneData = await sceneResult.json();
            setSceneDescription(sceneData.sceneDescription);
          }

          // Generate coaching tips
          const tipsResult = await fetch('/api/ai/generate-tips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              context: {
                scenario: scenario.title,
                personality: persona,
                setting: scenario.setting
              }
            })
          });
          
          if (tipsResult.ok) {
            const tipsData = await tipsResult.json();
            setCoachingTips(tipsData.coachingTips);
          }

        } catch (error) {
          console.error('Error initializing scenario:', error);
          // Fallback scene and tips
          setSceneDescription(`You find yourself in ${scenario.setting} where you notice ${persona.name}. This is your chance to start a conversation.`);
          setCoachingTips(`• Be authentic and respectful\n• Start with something relevant to the setting\n• Show genuine interest\n• Keep the conversation natural`);
        }
      }
    };

    if (scenario && persona) {
      initializeScenario();
    }
  }, [scenarioId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startConversation = () => {
    setConversationStarted(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !scenario || !persona || !userData) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setFeedback(null);

    try {
      // Generate AI response via API (server-side; keeps key secure)
      const aiRes = await fetch('/api/ai/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputValue,
          context: {
            personality: persona,
            setting: scenario.setting,
            conversationHistory: messages.map(msg => ({ role: msg.role, content: msg.content }))
          }
        })
      });
      if (!aiRes.ok) throw new Error('AI response failed');
      const { response: aiResponse } = await aiRes.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Generate feedback in the background (non-blocking) via API
      fetch('/api/ai/generate-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: inputValue,
          aiResponse,
          context: {
            scenario: scenario.title,
            personality: persona,
            conversationHistory: [...messages, userMessage, aiMessage].slice(-8).map(m => ({ role: m.role, content: m.content }))
          }
        })
      })
      .then(async res => {
        if (!res.ok) throw new Error('Feedback failed');
        const data = await res.json();
        setFeedback(data.feedback || data.response || data);
        setTipsPulse(true);
        setTimeout(() => setTipsPulse(false), 1500);
      })
      .catch(err => {
        console.error('Feedback generation failed:', err);
      });

      // Save to Supabase in the background (non-blocking)
      if (!conversationId && scenario) {
        createConversation(userData.id, scenario.id, sceneDescription).then(convoId => {
          if (convoId) {
            setConversationId(convoId);
            addMessageToConversation(convoId, userMessage);
            addMessageToConversation(convoId, aiMessage);
          }
        }).catch(error => {
          console.error('Conversation creation failed:', error);
        });
      } else if (conversationId) {
        addMessageToConversation(conversationId, userMessage).catch(error => {
          console.error('Message save failed:', error);
        });
        addMessageToConversation(conversationId, aiMessage).catch(error => {
          console.error('Message save failed:', error);
        });
      }

    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'ai',
        content: "I'm having trouble responding right now. Could you try again?",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setConversationStarted(false);
    setFeedback(null);
    setConversationId(null);
    setCurrentScore(null);
  };

  if (!scenario || !persona) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Scenario not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-white">{scenario.title}</h1>
                <div className="flex items-center text-sm text-slate-400 mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {scenario.setting}
                  <span className="mx-2">•</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    scenario.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                    scenario.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {scenario.difficulty}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300" disabled>
                <Volume2 className="w-4 h-4 mr-2" />
                Voice Mode
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Persona Info Bar */}
      <div className="border-b border-slate-800 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">{persona.name}</div>
                <div className="text-slate-400 text-sm">{persona.occupation}</div>
              </div>
            </div>
            <div className="ml-6 flex flex-wrap gap-2">
              {persona.traits.split(', ').slice(0, 3).map((trait, idx) => (
                <span key={idx} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
                  {trait.trim()}
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center text-slate-400 text-sm">
              <Trophy className="w-4 h-4 mr-1" />
              {scenario.category}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
        {!conversationStarted ? (
          /* Scene Setup Phase */
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Scene Description */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-semibold text-white mb-4">Scene</h2>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <p className="text-slate-300 text-lg leading-relaxed">
                  {sceneDescription || `You find yourself in ${scenario.setting} where you notice ${persona.name}. This is your chance to start a conversation.`}
                </p>
              </div>
            </motion.div>

            {/* Coaching Tips */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-white mb-4">Coaching Tips</h2>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-slate-300">
                    <p className="font-medium text-blue-400 mb-2">How to approach {persona.name}:</p>
                    <div className="whitespace-pre-line text-sm">
                      {coachingTips ? (
                        <div className="space-y-4">
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Recommended Tone</p>
                            <div className="inline-block px-2 py-1 bg-purple-500/15 text-purple-300 rounded-full text-xs">
                              {coachingTips.tone}
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Core Principles</p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {coachingTips.principles?.map((p: string, i: number) => (
                                <li key={i} className="px-3 py-2 rounded-lg bg-slate-700/60 border border-slate-600 text-sm">{p}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Suggested Openers</p>
                            <ul className="space-y-2">
                              {coachingTips.suggestedOpeners?.map((o: string, i: number) => (
                                <li key={i} className="px-3 py-2 rounded-lg bg-slate-700/60 border border-slate-600 text-sm italic">“{o}”</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Avoid</p>
                            <div className="flex flex-wrap gap-2">
                              {coachingTips.pitfallsToAvoid?.map((t: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-red-500/15 text-red-300 rounded-full text-xs">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        `• Be authentic and respectful\n• Start with something relevant to the setting\n• Show genuine interest\n• Keep the conversation natural`
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Start Button */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button 
                onClick={startConversation}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-3"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Conversation
              </Button>
            </motion.div>
          </div>
        ) : (
          /* Conversation Phase */
          <>
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none' 
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                  }`}>
                    <p>{message.content}</p>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-700">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Feedback */}
            {feedback && (
              <motion.div 
                className={`mx-4 mb-4 p-3 rounded-xl border ${
                  tipsOpen
                    ? feedback.rating === 'good' ? 'bg-green-500/10 border-green-500/20' : feedback.rating === 'improve' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-slate-700/50 border-slate-600'
                    : 'bg-slate-800/40 border-slate-700'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-3">
                  <Lightbulb className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    feedback.rating === 'good' ? 'text-green-400' :
                    feedback.rating === 'improve' ? 'text-yellow-400' :
                    'text-slate-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => setTipsOpen(o => !o)}
                        className={`px-2 py-1 rounded-full text-xs border transition ${tipsPulse ? 'animate-pulse' : ''} ${
                          feedback.rating === 'good' ? 'border-green-400/30 text-green-300' :
                          feedback.rating === 'improve' ? 'border-yellow-400/30 text-yellow-300' :
                          'border-slate-500 text-slate-300'
                        }`}
                        title="Toggle suggestions"
                      >
                        {tipsOpen ? 'Hide Tip' : 'Show Tip'}
                      </button>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${
                        feedback.rating === 'good' ? 'border-green-400/30 text-green-300' :
                        feedback.rating === 'improve' ? 'border-yellow-400/30 text-yellow-300' :
                        'border-slate-500 text-slate-300'
                      }`}>
                        {feedback.rating}
                      </span>
                      <p className={`font-medium ${
                        feedback.rating === 'good' ? 'text-green-400' :
                        feedback.rating === 'improve' ? 'text-yellow-400' :
                        'text-slate-300'
                      }`}>
                        WingMan Tip
                      </p>
                    </div>
                    {tipsOpen && (
                      <>
                        <p className="text-slate-300 text-sm mb-3">{feedback.message || (typeof feedback === 'string' ? feedback : '')}</p>
                        {feedback.suggestions && feedback.suggestions.length > 0 && (
                          <div className="text-xs text-slate-300">
                            <p className="font-medium mb-2 text-slate-400">Suggestions</p>
                            <div className="flex flex-wrap gap-2">
                              {feedback.suggestions.map((s: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 rounded-full bg-slate-700 border border-slate-600">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                  placeholder={`Start the conversation with ${persona.name}...`}
                  disabled={isLoading}
                  className="flex-1 bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}