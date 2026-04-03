import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { registerForPushNotifications } from '@/lib/notifications'

function useAuthGuard(session: Session | null, initialized: boolean) {
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!initialized) return
    const inAuth = segments[0] === '(auth)'
    if (!session && !inAuth) {
      router.replace('/(auth)/sign-in')
    } else if (session && inAuth) {
      router.replace('/(tabs)')
    }
  }, [session, initialized, segments])
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setInitialized(true)
      if (session?.user) {
        registerForPushNotifications(session.user.id).catch(() => {})
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        registerForPushNotifications(session.user.id).catch(() => {})
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useAuthGuard(session, initialized)

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    )
  }

  return <Slot />
}
