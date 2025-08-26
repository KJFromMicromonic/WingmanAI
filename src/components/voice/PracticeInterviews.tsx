'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  FileText, 
  Briefcase, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  Lightbulb,
  ChevronRight,
  Star,
  TrendingUp,
  Brain,
  Target,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interview personas - critical and challenging
export const INTERVIEW_PERSONAS = {
  'technical-senior': {
    name: 'Dr. Sarah Mitchell',
    title: 'Senior Technical Lead',
    company: 'TechCorp',
    voice: 'aura-2-luna-en',
    personality: 'Analytical, detail-oriented, expects technical precision',
    description: 'A senior technical interviewer who asks challenging technical questions',
    difficulty: 'Hard',
    style: 'Technical depth, problem-solving, system design'
  },
  'behavioral-manager': {
    name: 'Marcus Johnson',
    title: 'Engineering Manager',
    company: 'InnovateLabs',
    voice: 'aura-2-zeus-en',
    personality: 'Direct, results-focused, evaluates leadership potential',
    description: 'A manager who focuses on behavioral and leadership questions',
    difficulty: 'Medium',
    style: 'Leadership scenarios, team dynamics, conflict resolution'
  },
  'cultural-hr': {
    name: 'Jessica Chen',
    title: 'Head of People Operations',
    company: 'StartupX',
    voice: 'aura-2-stella-en',
    personality: 'Thorough, culture-focused, probes motivations deeply',
    description: 'An HR leader who evaluates cultural fit and motivation',
    difficulty: 'Medium',
    style: 'Cultural fit, values alignment, career goals'
  },
  'executive-ceo': {
    name: 'Robert Hamilton',
    title: 'CEO',
    company: 'Global Enterprises',
    voice: 'aura-2-arcas-en',
    personality: 'Strategic, demanding, high-level thinking required',
    description: 'A C-level executive who asks strategic and vision questions',
    difficulty: 'Extreme',
    style: 'Strategic thinking, business impact, long-term vision'
  },
  'panel-mixed': {
    name: 'Panel Interview',
    title: 'Mixed Panel',
    company: 'Various',
    voice: 'aura-2-orpheus-en',
    personality: 'Multiple perspectives, rapid-fire questions, high pressure',
    description: 'A panel of interviewers with different focuses and styles',
    difficulty: 'Extreme',
    style: 'Multiple domains, quick transitions, stress testing'
  }
} as const;

interface DocumentUpload {
  type: 'job_description' | 'resume';
  content: string;
  filename?: string;
}

interface InterviewState {
  status: 'setup' | 'uploading' | 'ready' | 'connecting' | 'active' | 'completed' | 'error';
  selectedPersona?: keyof typeof INTERVIEW_PERSONAS;
  adaptiveDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  documents: DocumentUpload[];
  connectionDetails?: any;
}

interface VoiceConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  room?: any;
  token?: string;
}

interface PracticeInterviewsProps {
  userId: string;
  onClose: () => void;
}

export function PracticeInterviews({ userId, onClose }: PracticeInterviewsProps) {
  const [interviewState, setInterviewState] = useState<InterviewState>({
    status: 'setup',
    documents: [],
    adaptiveDifficulty: 'intermediate'
  });
  
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>({
    status: 'disconnected'
  });
  
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [tipsPulse, setTipsPulse] = useState(false);
  
  const roomRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload (PDF, DOCX, TXT)
  const handleFileUpload = async (file: File, type: 'job_description' | 'resume') => {
    try {
      setInterviewState(prev => ({ ...prev, status: 'uploading' }));
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await fetch('/api/documents/parse', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to parse document');
      }
      
      const { content } = await response.json();
      
      setInterviewState(prev => ({
        ...prev,
        status: 'setup',
        documents: [
          ...prev.documents.filter(doc => doc.type !== type),
          { type, content, filename: file.name }
        ]
      }));
      
      if (type === 'job_description') {
        setJobDescription(content);
      } else {
        setResume(content);
      }
      
    } catch (error) {
      console.error('File upload error:', error);
      setInterviewState(prev => ({ ...prev, status: 'error' }));
    }
  };

  // Start interview session
  const startInterview = async () => {
    if (!interviewState.selectedPersona || !jobDescription || !resume) {
      return;
    }

    try {
      setConnectionState({ status: 'connecting' });
      setInterviewState(prev => ({ ...prev, status: 'connecting' }));

      const persona = INTERVIEW_PERSONAS[interviewState.selectedPersona];
      
      // Generate room token with interview context
      const tokenResponse = await fetch('/api/voice/interview-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `interview-${interviewState.selectedPersona}-${Date.now()}`,
          participantName: `candidate-${userId}`,
          metadata: {
            scenario: 'Job Interview',
            interview_type: interviewState.selectedPersona,
            difficulty: interviewState.adaptiveDifficulty,
            user_id: userId,
            persona_name: persona.name,
            persona_title: persona.title,
            persona_company: persona.company,
            persona_voice: persona.voice,
            persona_personality: persona.personality,
            persona_style: persona.style,
            job_description: jobDescription,
            candidate_resume: resume,
            session_type: 'interview_practice',
            client_type: 'web_frontend',
            timestamp: Date.now()
          }
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get interview room token');
      }

      const { token, roomName, wsUrl } = await tokenResponse.json();

      // Import LiveKit and connect
      const { Room, RoomEvent, Track } = await import('livekit-client');
      
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          audioPreset: {
            maxBitrate: 64000,
          }
        }
      });

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('✅ Connected to interview session');
        setConnectionState({ status: 'connected', room, token });
        setInterviewState(prev => ({ ...prev, status: 'active' }));
      });

      room.on(RoomEvent.ConnectionError, (error) => {
        console.error('🚨 Interview connection error:', error);
        setConnectionState({ status: 'error' });
        setInterviewState(prev => ({ ...prev, status: 'error' }));
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio && participant.isAgent) {
          console.log('🤖 Interviewer audio track subscribed');
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
          audioElement.play();
        }
      });

      room.on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          console.log('📨 Interview data received:', data);
          
          if (data.type === 'transcript') {
            setTranscript(prev => [...prev, `${data.speaker}: ${data.text}`]);
          } else if (data.status === 'feedback_recorded') {
            const feedbackData = data.feedback || data;
            setFeedback(prev => [feedbackData]);
            setTipsPulse(true);
            setTimeout(() => setTipsPulse(false), 1500);
            
            // Update adaptive difficulty based on performance
            if (data.feedback?.confidence_level < 4) {
              setInterviewState(prev => ({
                ...prev,
                adaptiveDifficulty: 'beginner'
              }));
            } else if (data.feedback?.confidence_level > 7) {
              setInterviewState(prev => ({
                ...prev,
                adaptiveDifficulty: prev.adaptiveDifficulty === 'expert' ? 'expert' : 'advanced'
              }));
            }
          } else if (data.status === 'performance_update') {
            setPerformanceMetrics(data.metrics);
          } else if (data.type === 'agent_speaking') {
            setIsAgentSpeaking(data.speaking);
          }
        } catch (e) {
          console.warn('Failed to parse interview data:', e);
        }
      });

      await room.connect(wsUrl, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      
      roomRef.current = room;

    } catch (error) {
      console.error('Failed to start interview:', error);
      setConnectionState({ status: 'error' });
      setInterviewState(prev => ({ ...prev, status: 'error' }));
    }
  };

  const endInterview = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    setConnectionState({ status: 'disconnected' });
    setInterviewState(prev => ({ ...prev, status: 'completed' }));
  };

  const toggleMute = async () => {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  if (interviewState.status === 'setup') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-slate-800 rounded-xl p-6 w-full max-w-4xl mx-4 border border-slate-700 my-8"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-purple-500/20 p-3 rounded-xl">
                <Briefcase className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Practice Interviews</h2>
            <p className="text-slate-400">
              Prepare for challenging interviews with AI-powered mock sessions
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Upload Section */}
            <div className="space-y-6">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="w-5 h-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Job Description */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="text-slate-300">Job Description</Label>
                      {jobDescription && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    <Textarea
                      placeholder="Paste the job description here or upload a file..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white h-[120px] resize-none"
                    />
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-slate-600 text-slate-300"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'job_description');
                        }}
                      />
                    </div>
                  </div>

                  {/* Resume */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="text-slate-300">Your Resume/CV</Label>
                      {resume && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    <Textarea
                      placeholder="Paste your resume here or upload a file..."
                      value={resume}
                      onChange={(e) => setResume(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white h-[120px] resize-none"
                    />
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-slate-600 text-slate-300"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Resume
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interviewer Selection */}
            <div className="space-y-6">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Brain className="w-5 h-5" />
                    Select Interviewer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(INTERVIEW_PERSONAS).map(([key, persona]) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setInterviewState(prev => ({ ...prev, selectedPersona: key as keyof typeof INTERVIEW_PERSONAS }))}
                        className={`w-full text-left p-4 rounded-lg border transition ${
                          interviewState.selectedPersona === key
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-white">{persona.name}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                persona.difficulty === 'Extreme' ? 'bg-red-500/20 text-red-400' :
                                persona.difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {persona.difficulty}
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm mb-1">{persona.title} at {persona.company}</p>
                            <p className="text-slate-300 text-xs">{persona.description}</p>
                            <p className="text-slate-500 text-xs mt-1">Focus: {persona.style}</p>
                          </div>
                          {interviewState.selectedPersona === key && (
                            <ChevronRight className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Adaptive Difficulty */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="w-5 h-5" />
                    Adaptive Difficulty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {['beginner', 'intermediate', 'advanced', 'expert'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setInterviewState(prev => ({ ...prev, adaptiveDifficulty: level as any }))}
                        className={`p-2 rounded text-sm transition ${
                          interviewState.adaptiveDifficulty === level
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-400 text-xs mt-2">
                    The interview will adapt based on your performance
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={startInterview}
              disabled={!interviewState.selectedPersona || !jobDescription || !resume}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Start Interview
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Active, Connecting, Completed, or Error States
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-700"
      >
        {/* Header */}
        {interviewState.selectedPersona && (
          <div className="text-center p-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-1">
              Interview with {INTERVIEW_PERSONAS[interviewState.selectedPersona].name}
            </h2>
            <p className="text-slate-400 text-sm">
              {INTERVIEW_PERSONAS[interviewState.selectedPersona].title}
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                interviewState.adaptiveDifficulty === 'expert' ? 'bg-red-500/20 text-red-400' :
                interviewState.adaptiveDifficulty === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
                interviewState.adaptiveDifficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                Difficulty: {interviewState.adaptiveDifficulty}
              </span>
              {performanceMetrics && (
                <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                  Score: {performanceMetrics.overall_score}/100
                </span>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-3 gap-6">
          {/* Transcript & Agent Status */}
          <div className="col-span-3 lg:col-span-2 flex flex-col">
            <div className="flex-1 bg-slate-900/50 rounded-lg p-4 space-y-4 overflow-y-auto">
              {transcript.map((line, index) => (
                <p key={index} className="text-slate-300">{line}</p>
              ))}
              {isAgentSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-purple-400"
                >
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span>Interviewer is speaking...</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Feedback & Tips */}
          <div className="col-span-3 lg:col-span-1 space-y-4">
            <h3 className="text-white font-semibold">Live Feedback</h3>
            <AnimatePresence>
              {feedback.map((fb, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`p-3 rounded-lg border ${
                    fb.rating === 'good' ? 'bg-green-500/10 border-green-500/30' :
                    fb.rating === 'improve' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <p className="text-sm text-white font-medium">{fb.skill_focus}</p>
                  <p className="text-xs text-slate-300 mt-1">{fb.feedback}</p>
                  {fb.tips && <p className="text-xs text-purple-300 mt-2">Tip: {fb.tips}</p>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between">
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setTipsOpen(!tipsOpen)}
              className="border-slate-600 text-slate-300"
            >
              <Lightbulb className="w-5 h-5 mr-2" />
              Tips
            </Button>
            {tipsPulse && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleMute} className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition text-white">
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button onClick={endInterview} className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition text-white">
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
          <div className="w-24"> {/* Spacer */} </div>
        </div>

        {/* Status Overlays */}
        <AnimatePresence>
          {connectionState.status !== 'connected' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8"
            >
              {connectionState.status === 'connecting' && (
                <>
                  <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <h3 className="text-xl font-bold text-white">Connecting to Interview...</h3>
                  <p className="text-slate-400">Please wait while we set up the session.</p>
                </>
              )}
              {interviewState.status === 'completed' && (
                <>
                  <h3 className="text-2xl font-bold text-white mb-4">Interview Completed</h3>
                  {/* You can add a summary report here using performanceMetrics */}
                  <Button onClick={onClose} className="mt-4 bg-purple-600 hover:bg-purple-700">
                    Close
                  </Button>
                </>
              )}
              {connectionState.status === 'error' && (
                <>
                  <h3 className="text-2xl font-bold text-red-400 mb-4">Connection Error</h3>
                  <p className="text-slate-400">
                    Sorry, we couldn't connect to the interview session. Please try again.
                  </p>
                  <Button onClick={onClose} className="mt-4 bg-purple-600 hover:bg-purple-700">
                    Close
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );