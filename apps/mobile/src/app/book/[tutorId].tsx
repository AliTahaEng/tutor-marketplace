import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { BookingStateMachine } from '@tutor/core'

const DURATIONS = [60, 90, 120]
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type Slot = {
  dayOfWeek: number
  startTime: string
  isoDateTime: string
  displayLabel: string
}

/** Compute next calendar occurrence of a given weekday + time */
function nextOccurrence(dayOfWeek: number, startTime: string): Date {
  const now = new Date()
  const [h, m] = startTime.split(':').map(Number)
  const result = new Date(now)
  result.setHours(h, m, 0, 0)
  const diff = (dayOfWeek - now.getDay() + 7) % 7
  result.setDate(now.getDate() + (diff === 0 && result <= now ? 7 : diff))
  return result
}

export default function BookSessionScreen() {
  const { tutorId } = useLocalSearchParams<{ tutorId: string }>()
  const router = useRouter()
  const [tutor, setTutor] = useState<any>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [sessionMode, setSessionMode] = useState<'online' | 'in_person'>('online')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadTutor() }, [tutorId])

  async function loadTutor() {
    const { data: tp } = await supabase
      .from('tutor_profiles')
      .select('id, hourly_rate_qar, session_type')
      .eq('id', tutorId)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', tutorId)
      .single()

    const { data: avail } = await supabase
      .from('tutor_availability')
      .select('day_of_week, start_time, end_time')
      .eq('tutor_id', tutorId)
      .order('day_of_week')

    if (tp && profile) {
      setTutor({ ...tp, full_name: profile.full_name })
      // Build next occurrence slots
      const computedSlots: Slot[] = (avail ?? []).map(slot => {
        const date = nextOccurrence(slot.day_of_week, slot.start_time)
        return {
          dayOfWeek: slot.day_of_week,
          startTime: slot.start_time,
          isoDateTime: date.toISOString(),
          displayLabel: `${DAY_NAMES[slot.day_of_week]}, ${date.toLocaleDateString('en-QA', { month: 'short', day: 'numeric' })} at ${slot.start_time}`,
        }
      })
      setSlots(computedSlots)
      if (computedSlots.length) setSelectedSlot(computedSlots[0])
      // Default session mode
      if (tp.session_type === 'in_person') setSessionMode('in_person')
      else setSessionMode('online')
    }
    setLoading(false)
  }

  async function handleBook() {
    if (!selectedSlot) return Alert.alert('Error', 'Please select a time slot')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const amounts = BookingStateMachine.calculateAmounts(
      Number(tutor.hourly_rate_qar),
      selectedDuration
    )

    setSubmitting(true)
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        student_id: user.id,
        tutor_id: tutorId,
        status: 'pending_payment',
        session_mode: sessionMode,
        scheduled_at: selectedSlot.isoDateTime,
        duration_minutes: selectedDuration,
        hourly_rate_qar: Number(tutor.hourly_rate_qar),
        total_amount_qar: amounts.totalAmountQar,
        platform_fee_qar: amounts.platformFeeQar,
        tutor_payout_qar: amounts.tutorPayoutQar,
      })
      .select('id')
      .single()

    setSubmitting(false)

    if (error || !booking) {
      Alert.alert('Error', error?.message ?? 'Failed to create booking')
      return
    }

    // Open payment page in in-app browser
    const appUrl = process.env.EXPO_PUBLIC_APP_URL ?? 'https://tutorqatar.com'
    await WebBrowser.openBrowserAsync(`${appUrl}/bookings/${booking.id}/pay`)

    // Navigate to bookings list after payment flow
    router.replace('/(tabs)/bookings')
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
  if (!tutor) return <View style={styles.center}><Text>Tutor not found</Text></View>

  const amounts = BookingStateMachine.calculateAmounts(Number(tutor.hourly_rate_qar), selectedDuration)

  return (
    <>
      <Stack.Screen options={{ title: `Book ${tutor.full_name ?? 'Session'}` }} />
      <ScrollView style={styles.container}>
        {/* Time slot selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time Slot</Text>
          {slots.length === 0 ? (
            <Text style={styles.noSlots}>This tutor hasn't set their availability yet.</Text>
          ) : (
            slots.map((slot, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.slotBtn, selectedSlot?.isoDateTime === slot.isoDateTime && styles.slotBtnActive]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={selectedSlot?.isoDateTime === slot.isoDateTime ? '#6C63FF' : '#94a3b8'}
                />
                <Text style={[styles.slotText, selectedSlot?.isoDateTime === slot.isoDateTime && styles.slotTextActive]}>
                  {slot.displayLabel}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Duration selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.durationBtn, selectedDuration === d && styles.durationBtnActive]}
                onPress={() => setSelectedDuration(d)}
              >
                <Text style={[styles.durationText, selectedDuration === d && styles.durationTextActive]}>
                  {d} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Session mode — only show if tutor offers both */}
        {tutor.session_type === 'both' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Mode</Text>
            <View style={styles.durationRow}>
              {(['online', 'in_person'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.durationBtn, sessionMode === m && styles.durationBtnActive]}
                  onPress={() => setSessionMode(m)}
                >
                  <Ionicons
                    name={m === 'online' ? 'videocam-outline' : 'location-outline'}
                    size={14}
                    color={sessionMode === m ? '#6C63FF' : '#94a3b8'}
                  />
                  <Text style={[styles.durationText, sessionMode === m && styles.durationTextActive]}>
                    {m === 'online' ? 'Online' : 'In Person'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Price summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Price Summary</Text>
          <Row label="Session fee" value={`${amounts.totalAmountQar} QAR`} />
          <Row label="Platform fee (15%)" value={`${amounts.platformFeeQar} QAR`} />
          <View style={styles.divider} />
          <Row label="Total" value={`${amounts.totalAmountQar} QAR`} bold />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerAmount}>{amounts.totalAmountQar} QAR</Text>
          <Text style={styles.footerLabel}>Total • {selectedDuration} min</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, (submitting || slots.length === 0) && styles.confirmBtnDisabled]}
          onPress={handleBook}
          disabled={submitting || slots.length === 0}
        >
          <Text style={styles.confirmBtnText}>{submitting ? 'Booking…' : 'Confirm & Pay'}</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && { fontWeight: '700', color: '#1a1a2e' }]}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: '700', color: '#6C63FF' }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  noSlots: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 12 },
  slotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  slotBtnActive: { borderColor: '#6C63FF', backgroundColor: '#EEF2FF' },
  slotText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  slotTextActive: { color: '#6C63FF', fontWeight: '700' },
  durationRow: { flexDirection: 'row', gap: 10 },
  durationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  durationBtnActive: { borderColor: '#6C63FF', backgroundColor: '#EEF2FF' },
  durationText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  durationTextActive: { color: '#6C63FF' },
  summary: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 14, color: '#64748b' },
  rowValue: { fontSize: 14, color: '#475569', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  footerAmount: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  footerLabel: { fontSize: 12, color: '#94a3b8' },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
