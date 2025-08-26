export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          date_of_birth: string | null
          professional_status: string | null
          gender: string | null
          relationship_status: string | null
          subscription_tier: 'trial' | 'weekly' | 'monthly' | 'free'
          profile_completed: boolean
          onboarding_completed: boolean
          is_premium: boolean
          stripe_customer_id: string | null
          created_at: string
          last_login: string
          streak: number
          badges: string[] | null
          practice_stats: Json | null
          login_history: Json[] | null
          usage_metrics: Json | null
        }
        Insert: {
          id: string
          email: string
          name: string
          date_of_birth?: string | null
          professional_status?: string | null
          gender?: string | null
          relationship_status?: string | null
          subscription_tier?: 'trial' | 'weekly' | 'monthly' | 'free'
          profile_completed?: boolean
          onboarding_completed?: boolean
          is_premium?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          last_login?: string
          streak?: number
          badges?: string[] | null
          practice_stats?: Json | null
          login_history?: Json[] | null
          usage_metrics?: Json | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          date_of_birth?: string | null
          professional_status?: string | null
          gender?: string | null
          relationship_status?: string | null
          subscription_tier?: 'trial' | 'weekly' | 'monthly' | 'free'
          profile_completed?: boolean
          onboarding_completed?: boolean
          is_premium?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          last_login?: string
          streak?: number
          badges?: string[] | null
          practice_stats?: Json | null
          login_history?: Json[] | null
          usage_metrics?: Json | null
        }
      }
      scenarios: {
        Row: {
          id: string
          title: string
          description: string
          setting: string
          category: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          is_premium: boolean
          persona_id: string
          image: string
          context: string
          objectives: string[] | null
          created_at: string
        }
        Insert: {
          id: string
          title: string
          description: string
          setting: string
          category: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          is_premium: boolean
          persona_id: string
          image: string
          context: string
          objectives?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          setting?: string
          category?: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          is_premium?: boolean
          persona_id?: string
          image?: string
          context?: string
          objectives?: string[] | null
          created_at?: string
        }
      }
      personas: {
        Row: {
          id: string
          name: string
          age: number
          occupation: string
          personality_traits: string[] | null
          interests: string[] | null
          communication_style: string
          background: string
          opening_lines: string[] | null
          response_patterns: Json | null
          voice_characteristics: Json | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          age: number
          occupation: string
          personality_traits?: string[] | null
          interests?: string[] | null
          communication_style: string
          background: string
          opening_lines?: string[] | null
          response_patterns?: Json | null
          voice_characteristics?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          age?: number
          occupation?: string
          personality_traits?: string[] | null
          interests?: string[] | null
          communication_style?: string
          background?: string
          opening_lines?: string[] | null
          response_patterns?: Json | null
          voice_characteristics?: Json | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          scenario_id: string
          started_at: string
          ended_at: string | null
          messages: Json[] | null
          completed: boolean
          feedback: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          scenario_id: string
          started_at?: string
          ended_at?: string | null
          messages?: Json[] | null
          completed?: boolean
          feedback?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          scenario_id?: string
          started_at?: string
          ended_at?: string | null
          messages?: Json[] | null
          completed?: boolean
          feedback?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Scenario = Database['public']['Tables']['scenarios']['Row']
export type Persona = Database['public']['Tables']['personas']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']

// Enhanced profile types
export interface UserProfile {
  id: string
  email: string
  name: string
  date_of_birth?: string
  professional_status?: string
  gender?: string
  relationship_status?: string
  subscription_tier: 'trial' | 'weekly' | 'monthly' | 'free'
  profile_completed: boolean
  onboarding_completed: boolean
  is_premium: boolean
  created_at: string
  last_login: string
  streak: number
  badges: string[]
  practice_stats: PracticeStats
  login_history: LoginSession[]
  usage_metrics: UsageMetrics
}

export interface PracticeStats {
  totalConversations: number
  completedScenarios: string[]
  voiceMinutes: number
  averageScore: number
  improvementRate: number
  favoriteScenarios: string[]
  weakAreas: string[]
  strongAreas: string[]
}

export interface LoginSession {
  timestamp: string
  ip_address?: string
  user_agent?: string
  duration?: number
}

export interface UsageMetrics {
  daily_usage: Record<string, number>
  weekly_usage: Record<string, number>
  monthly_usage: Record<string, number>
  feature_usage: {
    text_chat: number
    voice_practice: number
    feedback_views: number
    scenario_completions: number
  }
  engagement_score: number
  last_activity: string
}

export type SubscriptionTier = 'trial' | 'weekly' | 'monthly' | 'free'

export type Gender = 
  | 'man' 
  | 'woman' 
  | 'non-binary' 
  | 'genderfluid' 
  | 'agender' 
  | 'prefer-not-to-say' 
  | 'other'

export type RelationshipStatus = 
  | 'single' 
  | 'dating' 
  | 'in-a-relationship' 
  | 'engaged' 
  | 'married' 
  | 'its-complicated' 
  | 'prefer-not-to-say'

export type ProfessionalStatus = 
  | 'student' 
  | 'employed' 
  | 'self-employed' 
  | 'unemployed' 
  | 'retired' 
  | 'freelancer' 
  | 'entrepreneur' 
  | 'prefer-not-to-say'