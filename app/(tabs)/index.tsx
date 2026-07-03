import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { format } from 'date-fns'
import { theme } from '@/constants/theme'
import { useCurrentWeek } from '@/hooks/useWeek'
import { useWeekWorkouts } from '@/hooks/useWorkouts'
import WeekGrid from '@/components/WeekGrid'
import MuscleGroupBar from '@/components/MuscleGroupBar'
import StreakBadge from '@/components/StreakBadge'

export default function ThisWeekScreen() {
  const router = useRouter()
  const days = useCurrentWeek()
  const { sessions, loading, refetch } = useWeekWorkouts(days[0].dateStr, days[6].dateStr)

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  const completed = sessions.filter((s) => s.status === 'completed')
  const totalSets = completed.reduce((acc, s) => acc + (s.workout_sets?.filter((w) => !w.is_warmup).length ?? 0), 0)
  const totalVolume = completed.reduce((acc, s) =>
    acc + (s.workout_sets?.filter((w) => !w.is_warmup && w.actual_weight && w.actual_reps)
      .reduce((a, w) => a + (w.actual_weight! * w.actual_reps!), 0) ?? 0), 0)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>This Week</Text>
          <Text style={styles.subheading}>{format(new Date(), 'd MMM')} · {days[0].dayName} – {days[6].dayName}</Text>
        </View>
        <View style={styles.headerRight}>
          <StreakBadge />
          <TouchableOpacity onPress={() => router.push('/stats')} style={styles.statsBtn}>
            <Text style={styles.statsBtnText}>Stats</Text>
          </TouchableOpacity>
        </View>
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
                router.push({ pathname: '/workout/new', params: { date: dateStr } })
              }
            }}
          />

          {completed.length > 0 && (
            <View style={styles.summaryRow}>
              <SummaryChip label="Sessions" value={String(completed.length)} />
              <SummaryChip label="Working Sets" value={String(totalSets)} />
              <SummaryChip label="Volume" value={`${Math.round(totalVolume / 1000)}k kg`} />
            </View>
          )}

          <MuscleGroupBar sessions={sessions} />
        </>
      )}
    </ScrollView>
  )
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
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
  headerRight: { alignItems: 'flex-end', gap: theme.spacing.sm },
  heading: { fontSize: theme.fontSize.xxl, fontWeight: '800', color: theme.colors.text },
  subheading: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginTop: 2 },
  statsBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statsBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  chip: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipValue: { fontSize: theme.fontSize.xl, fontWeight: '700', color: theme.colors.accent },
  chipLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
})
