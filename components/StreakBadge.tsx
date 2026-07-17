import { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { startOfWeek, subWeeks, format } from 'date-fns'
import { supabase, getUserId } from '@/lib/supabase'
import { theme } from '@/constants/theme'

export default function StreakBadge() {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    async function calcStreak() {
      const userId = await getUserId()
      if (!userId) return

      // Fetch last 26 weeks of completed sessions
      const since = format(subWeeks(new Date(), 26), 'yyyy-MM-dd')
      const { data } = await supabase
        .from('workout_sessions')
        .select('date')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('date', since)

      if (!data || data.length === 0) return

      // Build a set of week-start strings that had activity
      const activeWeeks = new Set(
        data.map((s) => format(startOfWeek(new Date(s.date), { weekStartsOn: 1 }), 'yyyy-MM-dd')),
      )

      // Count consecutive weeks back from current week
      let count = 0
      let week = startOfWeek(new Date(), { weekStartsOn: 1 })
      while (activeWeeks.has(format(week, 'yyyy-MM-dd'))) {
        count++
        week = subWeeks(week, 1)
      }
      setStreak(count)
    }
    calcStreak()
  }, [])

  if (streak === 0) return null

  return (
    <View style={styles.badge}>
      <Text style={styles.fire}>🔥</Text>
      <Text style={styles.count}>{streak}</Text>
      <Text style={styles.label}>wk</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardWarm,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    gap: 3,
    ...theme.shadow.soft,
  },
  fire: { fontSize: 14 },
  count: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.accent,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.textMuted,
  },
})
