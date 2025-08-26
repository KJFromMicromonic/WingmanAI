import { createClient } from './supabase/client'
import { 
  User, 
  UserProfile, 
  PracticeStats, 
  LoginSession, 
  UsageMetrics,
  Gender,
  RelationshipStatus,
  ProfessionalStatus,
  SubscriptionTier
} from './supabase/types'

export interface UserData {
  id: string
  email: string
  name: string
  date_of_birth?: string
  professional_status?: string
  gender?: string
  relationship_status?: string
  subscription_tier: SubscriptionTier
  profile_completed: boolean
  onboarding_completed: boolean
  is_premium: boolean
  stripe_customer_id: string | null
  created_at: string
  last_login: string
  streak: number
  badges: string[]
  practice_stats: PracticeStats
  login_history: LoginSession[]
  usage_metrics: UsageMetrics
}

export interface ProfileUpdateData {
  name?: string
  date_of_birth?: string
  professional_status?: ProfessionalStatus
  gender?: Gender
  relationship_status?: RelationshipStatus
}

export async function createUser(userData: any, subscriptionTier: SubscriptionTier = 'free'): Promise<UserData | null> {
  try {
    const supabase = createClient()
    
    const defaultPracticeStats: PracticeStats = {
      totalConversations: 0,
      completedScenarios: [],
      voiceMinutes: 0,
      averageScore: 0,
      improvementRate: 0,
      favoriteScenarios: [],
      weakAreas: [],
      strongAreas: []
    }

    const defaultUsageMetrics: UsageMetrics = {
      daily_usage: {},
      weekly_usage: {},
      monthly_usage: {},
      feature_usage: {
        text_chat: 0,
        voice_practice: 0,
        feedback_views: 0,
        scenario_completions: 0
      },
      engagement_score: 0,
      last_activity: new Date().toISOString()
    }

    const loginSession: LoginSession = {
      timestamp: new Date().toISOString(),
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
    }
    
    const userDataDoc: any = {
      id: userData.id,
      email: userData.emailAddresses[0]?.emailAddress || '',
      name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : 'User',
      subscription_tier: subscriptionTier,
      profile_completed: false,
      onboarding_completed: false,
      is_premium: subscriptionTier !== 'free',
      stripe_customer_id: null,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      streak: 0,
      badges: [],
      practice_stats: defaultPracticeStats,
      login_history: [loginSession],
      usage_metrics: defaultUsageMetrics
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
      date_of_birth: undefined,
      professional_status: undefined,
      gender: undefined,
      relationship_status: undefined,
      subscription_tier: subscriptionTier,
      profile_completed: false,
      onboarding_completed: false,
      is_premium: subscriptionTier !== 'free',
      stripe_customer_id: null,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      streak: 0,
      badges: [],
      practice_stats: {
        totalConversations: 0,
        completedScenarios: [],
        voiceMinutes: 0,
        averageScore: 0,
        improvementRate: 0,
        favoriteScenarios: [],
        weakAreas: [],
        strongAreas: []
      },
      login_history: [],
      usage_metrics: {
        daily_usage: {},
        weekly_usage: {},
        monthly_usage: {},
        feature_usage: {
          text_chat: 0,
          voice_practice: 0,
          feedback_views: 0,
          scenario_completions: 0
        },
        engagement_score: 0,
        last_activity: new Date().toISOString()
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

  // Track login session
  await trackLoginSession(userId)

  await updateUser(userId, {
    streak: newStreak,
    last_login: new Date().toISOString()
  })

  return newStreak
}

// Profile management functions
export async function updateUserProfile(userId: string, profileData: ProfileUpdateData): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const updateData = {
      ...profileData,
      profile_completed: true // Mark profile as completed when updated
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user profile:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating user profile:', error)
    return false
  }
}

export async function completeOnboarding(userId: string, subscriptionTier: SubscriptionTier): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('users')
      .update({ 
        onboarding_completed: true,
        subscription_tier: subscriptionTier,
        is_premium: subscriptionTier !== 'free'
      })
      .eq('id', userId)

    if (error) {
      console.error('Error completing onboarding:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return false
  }
}

export async function trackLoginSession(userId: string): Promise<boolean> {
  try {
    const user = await getUser(userId)
    if (!user) return false

    const loginSession: LoginSession = {
      timestamp: new Date().toISOString(),
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
    }

    const updatedLoginHistory = [
      loginSession,
      ...(user.login_history || []).slice(0, 99) // Keep last 100 sessions
    ]

    await updateUser(userId, {
      login_history: updatedLoginHistory
    })

    return true
  } catch (error) {
    console.error('Error tracking login session:', error)
    return false
  }
}

export async function updateUsageMetrics(userId: string, feature: keyof UsageMetrics['feature_usage'], increment: number = 1): Promise<boolean> {
  try {
    const user = await getUser(userId)
    if (!user) return false

    const today = new Date().toISOString().split('T')[0]
    const thisWeek = getWeekKey(new Date())
    const thisMonth = new Date().toISOString().substring(0, 7) // YYYY-MM

    const updatedMetrics: UsageMetrics = {
      ...user.usage_metrics,
      daily_usage: {
        ...user.usage_metrics.daily_usage,
        [today]: (user.usage_metrics.daily_usage[today] || 0) + increment
      },
      weekly_usage: {
        ...user.usage_metrics.weekly_usage,
        [thisWeek]: (user.usage_metrics.weekly_usage[thisWeek] || 0) + increment
      },
      monthly_usage: {
        ...user.usage_metrics.monthly_usage,
        [thisMonth]: (user.usage_metrics.monthly_usage[thisMonth] || 0) + increment
      },
      feature_usage: {
        ...user.usage_metrics.feature_usage,
        [feature]: user.usage_metrics.feature_usage[feature] + increment
      },
      last_activity: new Date().toISOString()
    }

    // Calculate engagement score based on usage
    updatedMetrics.engagement_score = calculateEngagementScore(updatedMetrics)

    await updateUser(userId, {
      usage_metrics: updatedMetrics
    })

    return true
  } catch (error) {
    console.error('Error updating usage metrics:', error)
    return false
  }
}

export async function updatePracticeStats(userId: string, scenarioId: string, score: number, duration: number): Promise<boolean> {
  try {
    const user = await getUser(userId)
    if (!user) return false

    const updatedStats: PracticeStats = {
      ...user.practice_stats,
      totalConversations: user.practice_stats.totalConversations + 1,
      completedScenarios: user.practice_stats.completedScenarios.includes(scenarioId) 
        ? user.practice_stats.completedScenarios 
        : [...user.practice_stats.completedScenarios, scenarioId],
      averageScore: ((user.practice_stats.averageScore * user.practice_stats.totalConversations) + score) / (user.practice_stats.totalConversations + 1)
    }

    // Update voice minutes if it was a voice session
    if (duration > 0) {
      updatedStats.voiceMinutes += Math.round(duration / 60)
    }

    await updateUser(userId, {
      practice_stats: updatedStats
    })

    // Update usage metrics
    await updateUsageMetrics(userId, 'scenario_completions')

    return true
  } catch (error) {
    console.error('Error updating practice stats:', error)
    return false
  }
}

// Helper functions
function getWeekKey(date: Date): string {
  const year = date.getFullYear()
  const weekNumber = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`
}

function calculateEngagementScore(metrics: UsageMetrics): number {
  const totalFeatureUsage = Object.values(metrics.feature_usage).reduce((sum, count) => sum + count, 0)
  const recentActivity = Object.values(metrics.daily_usage).slice(-7).reduce((sum, count) => sum + count, 0)
  
  // Simple engagement score calculation (0-100)
  return Math.min(100, Math.round((totalFeatureUsage * 2) + (recentActivity * 5)))
}

export async function getUserDashboardData(userId: string) {
  const user = await getUser(userId)
  if (!user) return null

  return {
    totalConversations: user.practice_stats.totalConversations,
    streak: user.streak,
    level: calculateUserLevel(user.practice_stats.totalConversations),
    badges: user.badges,
    engagementScore: user.usage_metrics.engagement_score,
    completedScenarios: user.practice_stats.completedScenarios.length,
    voiceMinutes: user.practice_stats.voiceMinutes,
    averageScore: user.practice_stats.averageScore
  }
}

function calculateUserLevel(totalConversations: number): { level: number; title: string } {
  if (totalConversations < 5) return { level: 1, title: 'Beginner' }
  if (totalConversations < 15) return { level: 2, title: 'Novice' }
  if (totalConversations < 30) return { level: 3, title: 'Intermediate' }
  if (totalConversations < 50) return { level: 4, title: 'Advanced' }
  if (totalConversations < 100) return { level: 5, title: 'Expert' }
  return { level: 6, title: 'Master' }
}