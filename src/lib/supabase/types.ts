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
          is_premium: boolean
          stripe_customer_id: string | null
          created_at: string
          last_login: string
          streak: number
          badges: string[] | null
          practice_stats: Json | null
        }
        Insert: {
          id: string
          email: string
          name: string
          is_premium?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          last_login?: string
          streak?: number
          badges?: string[] | null
          practice_stats?: Json | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          is_premium?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          last_login?: string
          streak?: number
          badges?: string[] | null
          practice_stats?: Json | null
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