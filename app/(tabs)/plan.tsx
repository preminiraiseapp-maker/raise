import { useState, useCallback } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns'
import { theme } from '@/constants/theme'
import { useNextWeek } from '@/hooks/useWeek'
import { useWeekWorkouts } from '@/hooks/useWorkouts'
import { supabase, getUserId } from '@/lib/supabase'
import WeekGrid from '@/components/WeekGrid'

export default function PlanScreen() {
  const router = useRouter()
  const days = useNextWeek()
  const { sessions, loading, refetch } = useWeekWorkouts(days[0].dateStr, days[6].dateStr)
  const [copying, setCopying] = useState(false)

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  async function copyThisWeek() {
    const userId = await getUserId()
    if (!userId) return

    setCopying(true)
    try {
      // Source is the *current* week; each session is shifted +1 week so it
      // lands in the next week shown on this screen.
      const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const thisWeekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

      const { data: sourceSessions } = await supabase
        .from('workout_sessions')
        .select('*, workout_sets(*)')
        .eq('user_id', userId)
        .gte('date', thisWeekStart)
        .lte('date', thisWeekEnd)

      if (!sourceSessions || sourceSessions.length === 0) {
        Alert.alert('Nothing to copy', 'No sessions found for this week.')
        return
      }

      let copied = 0
      for (const session of sourceSessions) {
        const newDate = format(addWeeks(new Date(session.date + 'T00:00:00'), 1), 'yyyy-MM-dd')

        // Skip if a session already exists for this date
        if (sessions.some((s) => s.date === newDate)) continue

        const { data: newSession } = await supabase
          .from('workout_sessions')
          .insert({ user_id: userId, name: session.name, date: newDate, status: 'planned' })
          .select()
          .single()

        if (!newSession) continue
        copied++

        if (session.workout_sets?.length > 0) {
          await supabase.from('workout_sets').insert(
            session.workout_sets.map((s: any) => ({
              session_id: newSession.id,
              exercise_id: s.exercise_id,
              exercise_order: s.exercise_order,
              set_number: s.set_number,
              planned_reps: s.actual_reps ?? s.planned_reps,
              planned_weight: s.actual_weight ?? s.planned_weight,
              planned_duration_minutes: s.actual_duration_minutes ?? s.planned_duration_minutes,
            })),
          )
        }
      }

      refetch()
      Alert.alert(
        copied > 0 ? 'Done!' : 'Already planned',
        copied > 0
          ? `Copied ${copied} session${copied > 1 ? 's' : ''} to next week.`
          : 'Next week already has sessions on those days.',
      )
    } finally {
      setCopying(false)
    }
  }

  const nextWeekLabel = `${days[0].label} – ${days[6].label}`

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Plan Next Week</Text>
          <Text style={styles.subheading}>{nextWeekLabel}</Text>
        </View>
        <TouchableOpacity
          style={[styles.copyBtn, copying && styles.copyBtnDisabled]}
          onPress={copyThisWeek}
          disabled={copying}
        >
          {copying
            ? <ActivityIndicator size="small" color={theme.colors.accent} />
            : <Text style={styles.copyBtnText}>Copy This Week</Text>
          }
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <>
          <WeekGrid
            days={days}
            sessions={sessions}
            onDayPress={(dateStr, session) => {
              if (session) {
                router.push(`/workout/${session.id}`)
              } else {
                router.push({ pathname: '/workout/new', params: { date: dateStr, planned: '1' } })
              }
            }}
          />

          {sessions.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No sessions planned yet.</Text>
              <Text style={styles.emptyHint}>Tap a day above or copy this week to get started.</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  heading: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.display, color: theme.colors.text },
  subheading: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.textMuted, marginTop: 2 },
  copyBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.cardWarm,
    borderRadius: theme.radius.full,
    minWidth: 80,
    alignItems: 'center',
    ...theme.shadow.soft,
  },
  copyBtnDisabled: { opacity: 0.5 },
  copyBtnText: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.accent },
  empty: { alignItems: 'center', paddingTop: theme.spacing.xl },
  emptyText: { fontSize: theme.fontSize.lg, color: theme.colors.textMuted, fontWeight: '600' },
  emptyHint: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginTop: theme.spacing.sm, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
})
