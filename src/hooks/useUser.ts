import { useState, useEffect } from 'react'
import { useUser as useClerkUser } from '@clerk/nextjs'
import { getUser, createUser, updateStreak } from '@/lib/user'
import { useRouter } from 'next/navigation'

export function useUserData() {
  const { user: clerkUser, isLoaded } = useClerkUser()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoaded || !clerkUser) {
        setLoading(false)
        return
      }

      try {
        let user = await getUser(clerkUser.id)
        
        if (!user) {
          // Create new user
          user = await createUser(clerkUser)
        } else {
          // Update streak
          await updateStreak(clerkUser.id)
        }
        
        setUserData(user)
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [clerkUser, isLoaded])

  return { userData, loading }
}