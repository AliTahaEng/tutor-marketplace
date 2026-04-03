import { useCallback, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { Stack, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Half-hour time slots from 06:00 to 22:00
const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 22) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

type Slot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

type AddingSlot = {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export default function AvailabilityScreen() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState<AddingSlot | null>(null)
  const [tutorId, setTutorId] = useState<string | null>(null)

  useFocusEffect(useCallback(() => { loadSlots() }, []))

  async function loadSlots() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setTutorId(user.id)

    const { data } = await supabase
      .from('tutor_availability')
      .select('id, day_of_week, start_time, end_time')
      .eq('tutor_id', user.id)
      .order('day_of_week')
      .order('start_time')

    setSlots(data ?? [])
    setLoading(false)
  }

  async function handleDeleteSlot(slotId: string) {
    Alert.alert('Remove Slot', 'Remove this availability slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('tutor_availability')
            .delete()
            .eq('id', slotId)
          if (error) Alert.alert('Error', error.message)
          else setSlots(prev => prev.filter(s => s.id !== slotId))
        },
      },
    ])
  }

  async function handleAddSlot() {
    if (!adding || !tutorId) return

    if (adding.endTime <= adding.startTime) {
      Alert.alert('Invalid time', 'End time must be after start time')
      return
    }

    // Prevent duplicate
    const duplicate = slots.find(
      s => s.day_of_week === adding.dayOfWeek &&
           s.start_time  === adding.startTime
    )
    if (duplicate) {
      Alert.alert('Duplicate', 'You already have a slot at this time')
      return
    }

    setSaving(true)
    const { data, error } = await supabase
      .from('tutor_availability')
      .insert({
        tutor_id:    tutorId,
        day_of_week: adding.dayOfWeek,
        start_time:  adding.startTime,
        end_time:    adding.endTime,
      })
      .select('id, day_of_week, start_time, end_time')
      .single()

    setSaving(false)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    setSlots(prev =>
      [...prev, data].sort((a, b) =>
        a.day_of_week !== b.day_of_week
          ? a.day_of_week - b.day_of_week
          : a.start_time.localeCompare(b.start_time)
      )
    )
    setAdding(null)
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>
  }

  // Group slots by day for display
  const byDay: Record<number, Slot[]> = {}
  for (const slot of slots) {
    ;(byDay[slot.day_of_week] ??= []).push(slot)
  }

  return (
    <>
      <Stack.Screen options={{ title: 'My Availability' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Set your weekly recurring availability. Students will see the next occurrence of each slot.
        </Text>

        {/* Current slots grouped by day */}
        {[0, 1, 2, 3, 4, 5, 6].map(day => {
          const daySlots = byDay[day] ?? []
          return (
            <View key={day} style={styles.daySection}>
              <Text style={styles.dayName}>{DAY_NAMES[day]}</Text>
              {daySlots.length === 0 ? (
                <Text style={styles.noSlots}>No slots</Text>
              ) : (
                daySlots.map(slot => (
                  <View key={slot.id} style={styles.slotRow}>
                    <Ionicons name="time-outline" size={15} color="#6C63FF" />
                    <Text style={styles.slotTime}>{slot.start_time} – {slot.end_time}</Text>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteSlot(slot.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )
        })}

        {/* Add new slot form */}
        {adding ? (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>Add New Slot</Text>

            {/* Day picker */}
            <Text style={styles.fieldLabel}>Day of Week</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
              {DAY_SHORT.map((name, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dayChip, adding.dayOfWeek === idx && styles.dayChipActive]}
                  onPress={() => setAdding(prev => prev ? { ...prev, dayOfWeek: idx } : null)}
                >
                  <Text style={[styles.dayChipText, adding.dayOfWeek === idx && styles.dayChipTextActive]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Start time */}
            <Text style={styles.fieldLabel}>Start Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timePicker}>
              {TIME_OPTIONS.filter(t => t < '22:00').map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, adding.startTime === t && styles.timeChipActive]}
                  onPress={() => setAdding(prev => {
                    if (!prev) return null
                    // Auto-advance end time to be 1h after start if needed
                    const newEnd = prev.endTime <= t
                      ? TIME_OPTIONS.find(x => x > t) ?? t
                      : prev.endTime
                    return { ...prev, startTime: t, endTime: newEnd }
                  })}
                >
                  <Text style={[styles.timeChipText, adding.startTime === t && styles.timeChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* End time */}
            <Text style={styles.fieldLabel}>End Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timePicker}>
              {TIME_OPTIONS.filter(t => t > adding.startTime).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, adding.endTime === t && styles.timeChipActive]}
                  onPress={() => setAdding(prev => prev ? { ...prev, endTime: t } : null)}
                >
                  <Text style={[styles.timeChipText, adding.endTime === t && styles.timeChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.addFormActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAdding(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleAddSlot}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Add Slot'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAdding({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' })}
          >
            <Ionicons name="add-circle-outline" size={20} color="#6C63FF" />
            <Text style={styles.addButtonText}>Add Availability Slot</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 19 },
  daySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  dayName: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  noSlots: { fontSize: 13, color: '#cbd5e1', fontStyle: 'italic' },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  slotTime: { flex: 1, fontSize: 14, color: '#1a1a2e', fontWeight: '500' },
  deleteBtn: { padding: 4 },
  addForm: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    gap: 10,
  },
  addFormTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 2 },
  dayPicker: { flexGrow: 0, marginBottom: 4 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  dayChipActive: { borderColor: '#6C63FF', backgroundColor: '#EEF2FF' },
  dayChipText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  dayChipTextActive: { color: '#6C63FF', fontWeight: '700' },
  timePicker: { flexGrow: 0, marginBottom: 4 },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  timeChipActive: { borderColor: '#6C63FF', backgroundColor: '#EEF2FF' },
  timeChipText: { fontSize: 13, color: '#64748b' },
  timeChipTextActive: { color: '#6C63FF', fontWeight: '700' },
  addFormActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  saveBtn: {
    flex: 2,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
    padding: 16,
    marginTop: 8,
  },
  addButtonText: { fontSize: 15, color: '#6C63FF', fontWeight: '600' },
})
