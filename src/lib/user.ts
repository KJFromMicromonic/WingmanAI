import { createClient } from './supabase/client'
import { User } from './supabase/types'

export interface UserData {
  id: string
  email: string
  name: string
  is_premium: boolean
  stripe_customer_id: string | null
  created_at: string
  last_login: string
  streak: number
  badges: string[]
  practice_stats: {
    totalConversations: number
    completedScenarios: string[]
    voiceMinutes: number
  }
}

export async function createUser(userData: any): Promise<UserData | null> {
  try {
  const supabase = createClient()
  
  const userDataDoc: any = {
    id: userData.id,
    email: userData.emailAddresses[0]?.emailAddress || '',
    name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : 'User',
    is_premium: false,
    stripe_customer_id: null,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
    streak: 0,
    badges: [],
    practice_stats: {
      totalConversations: 0,
      completedScenarios: [],
      voiceMinutes: 0
    }
  }

  const { data, error } = await supabase
    .from('users')
    .insert(userDataDoc)
    .select()
    .single()

  if (error) {
    console.error('Error creating user:', {
      message: (error as any)?.message,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      code: (error as any)?.code,
    })
      // Return the userDataDoc as fallback if creation fails
      return userDataDoc as UserData
  }

  return data as UserData
  } catch (error) {
    console.error('Supabase connection error while creating user:', {
      message: (error as any)?.message,
    })
    // Return mock user data if Supabase isn't available
    return {
      id: userData.id,
      email: userData.emailAddresses?.[0]?.emailAddress || 'user@example.com',
      name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : 'User',
      is_premium: false,
      stripe_customer_id: null,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      streak: 0,
      badges: [],
      practice_stats: {
        totalConversations: 0,
        completedScenarios: [],
        voiceMinutes: 0
      }
    };
  }
}

export async function getUser(userId: string): Promise<UserData | null> {
  try {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
      // If it's a "not found" error, that's expected for new users
      if ((error as any)?.code === 'PGRST116') {
        return null; // User doesn't exist yet, will be created
      }
    console.error('Error fetching user:', {
      message: (error as any)?.message,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      code: (error as any)?.code,
    })
    return null
  }

  return data as UserData
  } catch (error) {
    console.error('Supabase connection error:', {
      message: (error as any)?.message,
    })
    // Return a mock user if Supabase isn't set up properly
    return {
      id: userId,
      email: 'user@example.com',
      name: 'User',
      is_premium: false,
      stripe_customer_id: null,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      streak: 0,
      badges: [],
      practice_stats: {
        totalConversations: 0,
        completedScenarios: [],
        voiceMinutes: 0
      }
    };
  }
}

export async function updateUser(userId: string, updates: Partial<UserData>): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)

  if (error) {
    console.error('Error updating user:', {
      message: (error as any)?.message,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      code: (error as any)?.code,
    })
    return false
  }

  return true
}

export async function updateStreak(userId: string): Promise<number> {
  const user = await getUser(userId)
  if (!user) return 0

  const today = new Date().toDateString()
  const lastLogin = new Date(user.last_login).toDateString()

  let newStreak = user.streak
  
  if (lastLogin === new Date(Date.now() - 86400000).toDateString()) {
    // Consecutive day
    newStreak += 1
  } else if (lastLogin !== today) {
    // New day, reset or start streak
    newStreak = 1
  }

  await updateUser(userId, {
    streak: newStreak,
    last_login: new Date().toISOString()
  })

  return newStreak
}