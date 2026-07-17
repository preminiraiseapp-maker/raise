import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { theme } from '@/constants/theme'
import { useCurrentWeek } from '@/hooks/useWeek'
import { useWeekWorkouts } from '@/hooks/useWorkouts'
import WeekGrid from '@/components/WeekGrid'
import MuscleGroupBar from '@/components/MuscleGroupBar'
import StreakBadge from '@/components/StreakBadge'
import ProgressRing from '@/components/ProgressRing'
import TodayWorkoutCard from '@/components/TodayWorkoutCard'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export default function ThisWeekScreen() {
  const router = useRouter()
  const days = useCurrentWeek()
  const { sessions, loading, refetch } = useWeekWorkouts(days[0].dateStr, days[6].dateStr)

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  const greeting = useMemo(getGreeting, [])
  const todayStr = days.find((d) => d.dateStr === format(new Date(), 'yyyy-MM-dd'))?.dateStr ?? days[0].dateStr
  const todaySession = sessions.find((s) => s.date === todayStr) ?? null

  const completed = sessions.filter((s) => s.status === 'completed')
  const totalSets = completed.reduce((acc, s) => acc + (s.workout_sets?.filter((w) => !w.is_warmup).length ?? 0), 0)
  const totalVolume = completed.reduce((acc, s) =>
    acc + (s.workout_sets?.filter((w) => !w.is_warmup && w.actual_weight && w.actual_reps)
      .reduce((a, w) => a + (w.actual_weight! * w.actual_reps!), 0) ?? 0), 0)

  const weekProgress = sessions.length > 0 ? completed.length / sessions.length : 0

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subheading}>{days[0].label} – {days[6].label}</Text>
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
          <View style={styles.progressCard}>
            <ProgressRing
              size={104}
              strokeWidth={11}
              progress={weekProgress}
              color={theme.colors.accent}
              trackColor={theme.colors.background}
            >
              <Text style={styles.ringValue}>{completed.length}/{sessions.length || 0}</Text>
            </ProgressRing>
            <View style={styles.progressText}>
              <Text style={styles.progressTitle}>Weekly Progress</Text>
              <Text style={styles.progressSubtitle}>
                {sessions.length === 0
                  ? 'No sessions planned yet'
                  : `${completed.length} of ${sessions.length} sessions completed`}
              </Text>
            </View>
          </View>

          <TodayWorkoutCard
            session={todaySession}
            onPress={() => {
              if (todaySession) {
                router.push(`/workout/${todaySession.id}`)
              } else {
                router.push({ pathname: '/workout/new', params: { date: todayStr } })
              }
            }}
          />

          <Text style={styles.sectionLabel}>This Week</Text>
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

          <MuscleGroupBar sessions={sessions} />

          <View style={styles.summaryRow}>
            <SummaryChip label="Sessions" value={String(completed.length)} />
            <SummaryChip label="Working Sets" value={String(totalSets)} />
            <SummaryChip label="Volume" value={`${Math.round(totalVolume / 1000)}k kg`} />
          </View>
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
  greeting: { fontSize: theme.fontSize.xxxl, fontFamily: theme.fonts.display, color: theme.colors.text },
  subheading: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.textMuted, marginTop: 4 },
  statsBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardWarm,
    ...theme.shadow.soft,
  },
  statsBtnText: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.text },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  ringValue: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.bodyExtraBold,
    color: theme.colors.text,
  },
  progressText: { flex: 1 },
  progressTitle: { fontSize: theme.fontSize.lg, fontFamily: theme.fonts.bodyBold, color: theme.colors.text },
  progressSubtitle: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.textMuted, marginTop: 4 },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: theme.spacing.md,
    marginBottom: -theme.spacing.xs,
  },
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
    ...theme.shadow.soft,
  },
  chipValue: { fontSize: theme.fontSize.xl, fontFamily: theme.fonts.bodyExtraBold, color: theme.colors.accent },
  chipLabel: { fontSize: theme.fontSize.xs, fontFamily: theme.fonts.bodyMedium, color: theme.colors.textMuted, marginTop: 2 },
})
