import { useCallback } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useFocusEffect } from 'expo-router'
import { format } from 'date-fns'
import { theme } from '@/constants/theme'
import { useExerciseHistory } from '@/hooks/useWorkouts'
import { useExercises } from '@/hooks/useExercises'
import { epley1RM } from '@/lib/oneRepMax'
import { LineChart } from 'react-native-gifted-charts'

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { sets, loading, refetch } = useExerciseHistory(id)
  const { exercises } = useExercises()

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  const exercise = exercises.find((e) => e.id === id)
  const isTime = exercise?.tracking_type === 'time'

  // Group by session date: pick top weight per session, or sum duration per session
  const sessionMap = new Map<string, { date: string; topWeight: number; totalSets: number; topReps: number; totalDuration: number }>()
  for (const s of sets) {
    const date = s.session?.date ?? ''
    const weight = s.actual_weight ?? 0
    const reps = s.actual_reps ?? 0
    const duration = s.actual_duration_minutes ?? 0
    if (!sessionMap.has(date)) {
      sessionMap.set(date, { date, topWeight: weight, totalSets: 0, topReps: reps, totalDuration: 0 })
    }
    const entry = sessionMap.get(date)!
    if (weight > entry.topWeight) {
      entry.topWeight = weight
      entry.topReps = reps
    }
    entry.totalDuration += duration
    entry.totalSets++
  }

  const sessionHistory = Array.from(sessionMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-20)

  const pr = sessionHistory.reduce<number>((max, s) => Math.max(max, s.topWeight), 0)
  const prEstimated1RM = sessionHistory.reduce<number>((max, s) => {
    const est = epley1RM(s.topWeight, s.topReps)
    return Math.max(max, est)
  }, 0)
  const longestSession = sessionHistory.reduce<number>((max, s) => Math.max(max, s.totalDuration), 0)
  const totalTime = sessionHistory.reduce<number>((sum, s) => sum + s.totalDuration, 0)

  const chartData = sessionHistory.map((s) => ({
    value: isTime ? s.totalDuration : s.topWeight,
    label: format(new Date(s.date + 'T00:00:00'), 'd/M'),
    dataPointColor: theme.colors.accent,
  }))

  const hasStats = isTime ? longestSession > 0 : pr > 0

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name}>{exercise?.name ?? 'Exercise'}</Text>
        {exercise?.muscle_group && (
          <Text style={styles.group}>{exercise.muscle_group}</Text>
        )}
      </View>

      {hasStats && (
        <View style={styles.prRow}>
          {isTime ? (
            <>
              <View style={styles.prCard}>
                <Text style={styles.prLabel}>Longest</Text>
                <Text style={styles.prValue}>{longestSession}min</Text>
              </View>
              <View style={styles.prCard}>
                <Text style={styles.prLabel}>Total Time</Text>
                <Text style={styles.prValue}>{totalTime}min</Text>
              </View>
              <View style={styles.prCard}>
                <Text style={styles.prLabel}>Sessions</Text>
                <Text style={styles.prValue}>{sessionHistory.length}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.prCard}>
                <Text style={styles.prLabel}>Top Weight</Text>
                <Text style={styles.prValue}>{pr}kg</Text>
              </View>
              <View style={styles.prCard}>
                <Text style={styles.prLabel}>Est. 1RM</Text>
                <Text style={styles.prValue}>{prEstimated1RM}kg</Text>
              </View>
              <View style={styles.prCard}>
                <Text style={styles.prLabel}>Sessions</Text>
                <Text style={styles.prValue}>{sessionHistory.length}</Text>
              </View>
            </>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 40 }} />
      ) : sessionHistory.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No history yet.</Text>
          <Text style={styles.emptyHint}>Log this exercise in a workout to see progress here.</Text>
        </View>
      ) : (
        <>
          {chartData.length >= 2 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>{isTime ? 'Duration Progress (min)' : 'Weight Progress (kg)'}</Text>
              <LineChart
                data={chartData}
                color={theme.colors.accent}
                thickness={2}
                curved
                hideDataPoints={chartData.length > 10}
                dataPointsColor={theme.colors.accent}
                xAxisColor={theme.colors.border}
                yAxisColor={theme.colors.border}
                yAxisTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: theme.colors.textMuted, fontSize: 9 }}
                hideRules={false}
                rulesColor={theme.colors.border}
                backgroundColor={theme.colors.card}
                height={160}
                width={280}
                startFillColor={`${theme.colors.accent}44`}
                endFillColor={`${theme.colors.accent}00`}
                areaChart
              />
            </View>
          )}

          <Text style={styles.historyTitle}>Recent Sessions</Text>
          {[...sessionHistory].reverse().slice(0, 8).map((s) => (
            <View key={s.date} style={styles.historyRow}>
              <Text style={styles.historyDate}>
                {format(new Date(s.date + 'T00:00:00'), 'EEE d MMM yyyy')}
              </Text>
              <View style={styles.historyRight}>
                {isTime ? (
                  <Text style={styles.historyWeight}>{s.totalDuration}min</Text>
                ) : (
                  <>
                    <Text style={styles.historyWeight}>{s.topWeight}kg</Text>
                    <Text style={styles.historySets}>{s.totalSets} sets</Text>
                  </>
                )}
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 40 },
  header: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md },
  name: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.display, color: theme.colors.text },
  group: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.accent, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  prRow: { flexDirection: 'row', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.lg },
  prCard: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: theme.spacing.md, alignItems: 'center', ...theme.shadow.soft },
  prLabel: { fontSize: theme.fontSize.xs, fontFamily: theme.fonts.bodyMedium, color: theme.colors.textMuted, marginBottom: 4 },
  prValue: { fontSize: theme.fontSize.xl, fontFamily: theme.fonts.bodyExtraBold, color: theme.colors.accent },
  chartCard: { marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.lg, backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.md, overflow: 'hidden', ...theme.shadow.card },
  chartTitle: { fontSize: theme.fontSize.md, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: theme.spacing.md },
  historyTitle: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.text, paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  historyDate: { fontSize: theme.fontSize.md, color: theme.colors.text },
  historyRight: { alignItems: 'flex-end' },
  historyWeight: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.accent },
  historySets: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: theme.spacing.xxl },
  emptyText: { fontSize: theme.fontSize.lg, color: theme.colors.textMuted, fontWeight: '600' },
  emptyHint: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginTop: theme.spacing.sm, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
})
