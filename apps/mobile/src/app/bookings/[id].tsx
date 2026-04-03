import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, TextInput,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'

const STATUS_COLOR: Record<string, string> = {
  pending_payment:       '#f59e0b',
  awaiting_confirmation: '#3b82f6',
  confirmed:             '#10b981',
  completed:             '#6C63FF',
  paid:                  '#6C63FF',
  cancelled:             '#ef4444',
  declined:              '#ef4444',
  refunded:              '#94a3b8',
  disputed:              '#f97316',
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment:       'Awaiting Payment',
  awaiting_confirmation: 'Pending Confirmation',
  confirmed:             'Confirmed',
  completed:             'Completed',
  paid:                  'Paid',
  cancelled:             'Cancelled',
  declined:              'Declined',
  refunded:              'Refunded',
  disputed:              'In Dispute',
}

const SUPABASE_FUNCTIONS_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.supabase.co/functions/v1') ?? ''

/** Call the booking-transition Edge Function (validates state machine + role server-side) */
async function callTransition(
  bookingId: string,
  toStatus: string,
  reason?: string
): Promise<{ error?: string }> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/booking-transition`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ bookingId, toStatus, reason }),
    })

    const data = await res.json()
    if (!res.ok || data.error) return { error: data.error ?? `HTTP ${res.status}` }
    return {}
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadBooking() }, [id])

  async function loadBooking() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()
    setUserRole(profile?.role ?? 'student')

    const { data } = await supabase
      .from('bookings')
      .select(`
        id, status, scheduled_at, duration_minutes, total_amount_qar,
        platform_fee_qar, tutor_payout_qar, session_mode, hourly_rate_qar,
        dispute_reason, dispute_resolved_at, cancellation_reason,
        tutor:tutor_id(id, full_name, email),
        student:student_id(id, full_name, email)
      `)
      .eq('id', id)
      .single()

    setBooking(data)
    setLoading(false)
  }

  async function transition(toStatus: string, reason?: string) {
    setSubmitting(true)
    const { error } = await callTransition(id, toStatus, reason)
    setSubmitting(false)

    if (error) {
      Alert.alert('Error', error)
    } else {
      await loadBooking()
    }
  }

  async function handleCancel() {
    let message: string

    if (userRole === 'tutor') {
      // Tutors always give the student a full refund when they cancel
      message = 'Are you sure you want to cancel this booking? The student will receive a full refund.'
    } else {
      // Students: check 24h threshold
      const hoursUntil = (new Date(booking.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60)
      message = hoursUntil < 24
        ? 'This session is within 24 hours.\n\nYou will receive a 35% partial refund. The tutor receives 50% as compensation for the late notice.'
        : 'Are you sure you want to cancel? You will receive a full refund.'
    }

    Alert.alert('Cancel Booking', message, [
      { text: 'Keep Booking', style: 'cancel' },
      {
        text: 'Cancel Booking',
        style: 'destructive',
        onPress: () => transition('cancelled', 'Cancelled by user'),
      },
    ])
  }

  async function handleOpenDispute() {
    if (!disputeReason.trim()) {
      Alert.alert('Error', 'Please describe the issue')
      return
    }
    await transition('disputed', disputeReason.trim())
    setShowDisputeForm(false)
    setDisputeReason('')
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
  }
  if (!booking) {
    return <View style={styles.center}><Text>Booking not found</Text></View>
  }

  const isStudent = userRole === 'student'
  const isTutor   = userRole === 'tutor'
  const status    = booking.status
  const color     = STATUS_COLOR[status] ?? '#94a3b8'
  const date      = new Date(booking.scheduled_at)
  const otherPerson = isStudent ? booking.tutor : booking.student
  const appUrl    = process.env.EXPO_PUBLIC_APP_URL ?? 'https://tutorqatar.com'

  return (
    <>
      <Stack.Screen options={{ title: 'Booking Details' }} />
      <ScrollView style={styles.container}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: color + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[styles.statusText, { color }]}>{STATUS_LABEL[status] ?? status}</Text>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{isStudent ? 'Your Tutor' : 'Student'}</Text>
          <Text style={styles.personName}>{otherPerson?.full_name ?? '—'}</Text>
          <Text style={styles.personEmail}>{otherPerson?.email ?? ''}</Text>
        </View>

        {/* Session details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Session Details</Text>
          <InfoRow icon="calendar-outline" label="Date"
            value={date.toLocaleDateString('en-QA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
          <InfoRow icon="time-outline" label="Time"
            value={date.toLocaleTimeString('en-QA', { hour: '2-digit', minute: '2-digit' })} />
          <InfoRow icon="hourglass-outline" label="Duration" value={`${booking.duration_minutes} minutes`} />
          <InfoRow
            icon={booking.session_mode === 'online' ? 'videocam-outline' : 'location-outline'}
            label="Mode"
            value={booking.session_mode?.replace('_', ' ')}
          />
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Payment</Text>
          <InfoRow icon="cash-outline" label="Rate"  value={`${booking.hourly_rate_qar} QAR/hr`} />
          <InfoRow icon="receipt-outline" label="Total" value={`${booking.total_amount_qar} QAR`} />
        </View>

        {/* Dispute info (read-only) */}
        {status === 'disputed' && booking.dispute_reason && (
          <View style={[styles.section, styles.disputeSection]}>
            <Text style={styles.disputeTitle}>Dispute Reason</Text>
            <Text style={styles.disputeText}>{booking.dispute_reason}</Text>
            {booking.dispute_resolved_at && (
              <Text style={styles.disputeResolved}>Resolved by admin</Text>
            )}
          </View>
        )}

        {/* Dispute form */}
        {showDisputeForm && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Describe the Issue</Text>
            <TextInput
              style={styles.textarea}
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="Explain what went wrong…"
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#f97316' }, submitting && styles.btnDisabled]}
              onPress={handleOpenDispute}
              disabled={submitting}
            >
              <Text style={styles.actionBtnText}>{submitting ? 'Submitting…' : 'Submit Dispute'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.textLink} onPress={() => setShowDisputeForm(false)}>
              <Text style={styles.textLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Actions ── */}
        <View style={styles.actions}>

          {/* Pay Now */}
          {isStudent && status === 'pending_payment' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#6C63FF' }]}
              onPress={() => WebBrowser.openBrowserAsync(`${appUrl}/bookings/${id}/pay`)}
            >
              <Ionicons name="card-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Pay Now — {booking.total_amount_qar} QAR</Text>
            </TouchableOpacity>
          )}

          {/* Tutor: confirm booking */}
          {isTutor && status === 'awaiting_confirmation' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#10b981' }, submitting && styles.btnDisabled]}
              onPress={() => transition('confirmed')}
              disabled={submitting}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{submitting ? 'Confirming…' : 'Confirm Booking'}</Text>
            </TouchableOpacity>
          )}

          {/* Tutor: decline booking */}
          {isTutor && status === 'awaiting_confirmation' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#ef4444' }, submitting && styles.btnDisabled]}
              onPress={() => {
                Alert.alert('Decline Booking', 'Are you sure you want to decline this request?', [
                  { text: 'Keep', style: 'cancel' },
                  { text: 'Decline', style: 'destructive', onPress: () => transition('declined') },
                ])
              }}
              disabled={submitting}
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Decline</Text>
            </TouchableOpacity>
          )}

          {/* Open chat */}
          {['confirmed', 'completed', 'disputed'].includes(status) && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
              onPress={() => router.push(`/chat/${id}`)}
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Open Chat</Text>
            </TouchableOpacity>
          )}

          {/* Student: mark complete */}
          {isStudent && status === 'confirmed' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#6C63FF' }, submitting && styles.btnDisabled]}
              onPress={() => {
                Alert.alert('Mark Complete', 'Confirm the session happened as scheduled?', [
                  { text: 'Not yet', style: 'cancel' },
                  { text: 'Yes, Complete', onPress: () => transition('completed') },
                ])
              }}
              disabled={submitting}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{submitting ? 'Updating…' : 'Mark Session Complete'}</Text>
            </TouchableOpacity>
          )}

          {/* Leave a review */}
          {isStudent && ['completed', 'paid'].includes(status) && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
              onPress={() => WebBrowser.openBrowserAsync(`${appUrl}/bookings/${id}/review`)}
            >
              <Ionicons name="star-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Leave a Review</Text>
            </TouchableOpacity>
          )}

          {/* Open dispute */}
          {isStudent && ['confirmed', 'completed'].includes(status) && !showDisputeForm && status !== 'disputed' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#f97316' }]}
              onPress={() => setShowDisputeForm(true)}
            >
              <Ionicons name="warning-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Report an Issue</Text>
            </TouchableOpacity>
          )}

          {/* Cancel — student or tutor, in eligible statuses */}
          {isStudent && ['pending_payment', 'awaiting_confirmation'].includes(status) && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#ef4444' }, submitting && styles.btnDisabled]}
              onPress={handleCancel}
              disabled={submitting}
            >
              <Ionicons name="close-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{submitting ? 'Cancelling…' : 'Cancel Booking'}</Text>
            </TouchableOpacity>
          )}

          {isTutor && ['awaiting_confirmation', 'confirmed'].includes(status) && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#ef4444' }, submitting && styles.btnDisabled]}
              onPress={handleCancel}
              disabled={submitting}
            >
              <Ionicons name="close-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{submitting ? 'Cancelling…' : 'Cancel Booking'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

function InfoRow({ icon, label, value }: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  value: string
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#6C63FF" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { flex: 1, textAlign: 'right', textTransform: 'capitalize' }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 15, fontWeight: '700' },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  personName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  personEmail: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoLabel: { fontSize: 14, color: '#64748b', width: 72 },
  infoValue: { fontSize: 14, color: '#1a1a2e', fontWeight: '600' },
  actions: { padding: 16, paddingTop: 4, gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 16,
  },
  btnDisabled: { opacity: 0.55 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disputeSection: { borderWidth: 1, borderColor: '#fed7aa' },
  disputeTitle: { fontSize: 13, fontWeight: '700', color: '#f97316', marginBottom: 8 },
  disputeText: { fontSize: 14, color: '#475569', lineHeight: 20 },
  disputeResolved: { fontSize: 12, color: '#10b981', marginTop: 8, fontWeight: '600' },
  textarea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1a1a2e',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  textLink: { alignItems: 'center', marginTop: 8 },
  textLinkText: { color: '#94a3b8', fontSize: 14 },
})
