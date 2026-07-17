import { useState, useCallback } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { format, startOfWeek, endOfWeek, subWeeks, isSameWeek } from 'date-fns'
import { theme } from '@/constants/theme'
import { useAllSessions } from '@/hooks/useWorkouts'
import { BarChart } from 'react-native-gifted-charts'
import type { WorkoutSession } from '@/types/database'

type WeekGroup = {
  label: string
  start: string
  end: string
  sessions: WorkoutSession[]
}

function groupByWeek(sessions: WorkoutSession[]): WeekGroup[] {
  const map = new Map<string, WeekGroup>()
  for (const s of sessions) {
    const d = new Date(s.date + 'T00:00:00')
    const weekStart = startOfWeek(d, { weekStartsOn: 1 })
    const key = format(weekStart, 'yyyy-MM-dd')
    if (!map.has(key)) {
      map.set(key, {
        label: `${format(weekStart, 'd MMM')} – ${format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'd MMM yyyy')}`,
        start: key,
        end: format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        sessions: [],
      })
    }
    map.get(key)!.sessions.push(s)
  }
  return Array.from(map.values())
}

export default function HistoryScreen() {
  const router = useRouter()
  const { sessions, loading, refetch } = useAllSessions()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  const weeks = groupByWeek(sessions)

  // Last 8 weeks volume for chart
  const chartData = Array.from({ length: 8 }, (_, i) => {
    const w = subWeeks(new Date(), 7 - i)
    const weekSessions = sessions.filter((s) => isSameWeek(new Date(s.date + 'T00:00:00'), w, { weekStartsOn: 1 }))
    return {
      value: weekSessions.length,
      label: format(startOfWeek(w, { weekStartsOn: 1 }), 'd/M'),
      frontColor: theme.colors.accent,
    }
  })

  function toggleWeek(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>History</Text>

      {sessions.length >= 4 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Sessions per Week</Text>
          <BarChart
            data={chartData}
            barWidth={24}
            spacing={12}
            hideRules
            xAxisColor={theme.colors.border}
            yAxisColor={theme.colors.border}
            yAxisTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: theme.colors.textMuted, fontSize: 9 }}
            noOfSections={3}
            maxValue={7}
            height={120}
            barBorderRadius={4}
            backgroundColor={theme.colors.card}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 40 }} />
      ) : weeks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No completed workouts yet.</Text>
          <Text style={styles.emptyHint}>Complete a session from This Week to see it here.</Text>
        </View>
      ) : (
        weeks.map((week) => {
          const open = expanded.has(week.start)
          return (
            <View key={week.start} style={styles.weekBlock}>
              <TouchableOpacity style={styles.weekHeader} onPress={() => toggleWeek(week.start)}>
                <Text style={styles.weekLabel}>{week.label}</Text>
                <Text style={styles.weekMeta}>{week.sessions.length} session{week.sessions.length !== 1 ? 's' : ''} {open ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {open && week.sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionRow}
                  onPress={() => router.push(`/workout/${session.id}`)}
                >
                  <View>
                    <Text style={styles.sessionDate}>{format(new Date(session.date + 'T00:00:00'), 'EEE d MMM')}</Text>
                    <Text style={styles.sessionName}>{session.name}</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 40 },
  heading: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.display, color: theme.colors.text, paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md },
  chartCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  chartTitle: { fontSize: theme.fontSize.md, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: theme.spacing.md },
  weekBlock: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadow.soft,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  weekLabel: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.text },
  weekMeta: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sessionDate: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted },
  sessionName: { fontSize: theme.fontSize.md, color: theme.colors.text, fontWeight: '600', marginTop: 2 },
  arrow: { fontSize: 20, color: theme.colors.textMuted },
  empty: { alignItems: 'center', paddingTop: theme.spacing.xxl },
  emptyText: { fontSize: theme.fontSize.lg, color: theme.colors.textMuted, fontWeight: '600' },
  emptyHint: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginTop: theme.spacing.sm, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
})
