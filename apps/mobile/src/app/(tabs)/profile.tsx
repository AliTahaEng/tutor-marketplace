import { useCallback, useState } from 'react'
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  role: string | null
  phone: string | null
}

export default function ProfileScreen() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    loadProfile()
  }, []))

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, phone')
      .eq('id', user.id)
      .single()

    setProfile(data)
    setLoading(false)
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          // auth guard in _layout.tsx will redirect to sign-in
        },
      },
    ])
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
  }

  const avatarUrl = profile?.avatar_url
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name ?? 'U')}&background=6C63FF&color=fff&size=128`

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <Text style={styles.name}>{profile?.full_name ?? 'User'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>
            {profile?.role === 'tutor' ? '📚 Tutor' : '🎓 Student'}
          </Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.section}>
        {profile?.role === 'tutor' && (
          <>
            <MenuItem
              icon="school-outline"
              label="My Tutor Profile"
              onPress={() => router.push(`/tutor/${profile?.id}`)}
            />
            <MenuItem
              icon="calendar-outline"
              label="Manage Availability"
              onPress={() => router.push('/tutor/availability')}
            />
          </>
        )}
        <MenuItem
          icon="calendar-outline"
          label="My Bookings"
          onPress={() => router.push('/(tabs)/bookings')}
        />
        <MenuItem
          icon="chatbubbles-outline"
          label="Messages"
          onPress={() => router.push('/(tabs)/messages')}
        />
        <MenuItem
          icon="star-outline"
          label="My Reviews"
          onPress={() => {/* TODO: reviews screen */}}
        />
      </View>

      <View style={styles.section}>
        <MenuItem
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() => {/* TODO: support */}}
        />
        <MenuItem
          icon="log-out-outline"
          label="Sign Out"
          onPress={handleSignOut}
          danger
        />
      </View>

      <Text style={styles.version}>TutorQatar v1.0.0</Text>
    </ScrollView>
  )
}

function MenuItem({
  icon, label, onPress, danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  onPress: () => void
  danger?: boolean
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? '#ef4444' : '#6C63FF'} />
      <Text style={[styles.menuLabel, danger && { color: '#ef4444' }]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 40 },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
    backgroundColor: '#e2e8f0',
  },
  name: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  email: { fontSize: 14, color: '#94a3b8', marginBottom: 10 },
  rolePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 13, color: '#6C63FF', fontWeight: '600' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
  version: { textAlign: 'center', fontSize: 12, color: '#cbd5e1', marginTop: 20 },
})
